#!/usr/bin/env bash
# Project CI test runner, never a substitute for supported interactive device tools.
set -euo pipefail
mkdir -p artifacts/android-ui
# Keep the last device messages even if the emulator disconnects during a flow.
adb logcat -v threadtime > artifacts/android-ui/logcat-live.txt 2>&1 &
nylo_logcat_pid=$!
nylo_gesture_pid=""
collect() {
  if [ -n "$nylo_gesture_pid" ]; then kill "$nylo_gesture_pid" 2>/dev/null || true; fi
  kill "$nylo_logcat_pid" 2>/dev/null || true
  timeout 10s adb logcat -d -t 2000 > artifacts/android-ui/logcat.txt 2>&1 || true
  timeout 10s adb devices -l > artifacts/android-ui/adb-devices.txt 2>&1 || true
  ps -eo pid,ppid,stat,rss,args > artifacts/android-ui/runner-processes.txt
  sudo -n dmesg > artifacts/android-ui/runner-kernel.txt 2>&1 || true
  timeout 10s sudo -n coredumpctl --no-pager info > artifacts/android-ui/runner-coredump.txt 2>&1 || true
  if grep -q 'Signal: 11' artifacts/android-ui/runner-coredump.txt; then
    timeout 90s sudo -n coredumpctl debug --debugger-arguments='-batch -ex "thread apply all bt 5" -ex "info registers"' > artifacts/android-ui/emulator-backtrace.txt 2>&1 || true
  fi
  find /tmp/android-* -maxdepth 4 -type f -printf '%p %s bytes\n' > artifacts/android-ui/emulator-crash-files.txt 2>/dev/null || true
  if [ -d "$HOME/.maestro/tests" ]; then cp -R "$HOME/.maestro/tests" artifacts/android-ui/driver-diagnostics; fi
}
trap collect EXIT
adb install -r artifacts/android-build/Nylo-test.apk
# Exercise the OS navigation configuration, not a painted mock navigation bar.
mode="${ANDROID_NAVIGATION_MODE:-gestural}"
case "$mode" in
  gestural) expected_mode=2 ;;
  threebutton) expected_mode=0 ;;
  *) echo "Unknown Android navigation mode" >&2; exit 1 ;;
esac
adb shell cmd overlay enable-exclusive --category "com.android.internal.systemui.navbar.$mode"
for attempt in {1..10}; do
  actual_mode="$(adb shell settings get secure navigation_mode | tr -d '\r')"
  [ "$actual_mode" != "$expected_mode" ] || break
  sleep 1
done
[ "$actual_mode" = "$expected_mode" ] || { echo "System navigation mode did not apply" >&2; exit 1; }
printf 'Navigation: %s\nSystem navigation_mode: %s\n' "$mode" "$actual_mode" > artifacts/android-ui/navigation-mode.txt
adb shell cmd overlay list > artifacts/android-ui/navigation-overlays.txt
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
curl -fsSL --retry 3 --retry-all-errors --retry-delay 3 --retry-max-time 120 --connect-timeout 15 --max-time 60 https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip -o "$RUNNER_TEMP/android-maestro.zip"
echo "54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  $RUNNER_TEMP/android-maestro.zip" | sha256sum -c -
unzip -q "$RUNNER_TEMP/android-maestro.zip" -d "$RUNNER_TEMP/android-maestro"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
scenario="${ANDROID_UI_SCENARIO:-smoke}"
case "$scenario" in
  smoke) flow=e2e/android-smoke.yaml ;;
  sdk) flow=e2e/android-sdk.yaml ;;
  gallery)
    flow=e2e/android-gallery.yaml
    adb shell wm size 1170x2532
    adb shell wm density 480
    adb shell settings put system font_scale 1.0
    adb shell wm size > artifacts/android-ui/viewport.txt
    adb shell wm density >> artifacts/android-ui/viewport.txt
    adb shell settings get system font_scale >> artifacts/android-ui/viewport.txt
    python3 scripts/seed-android-gallery.py artifacts/android-ui/Nylo-QA-gallery.json
    adb push artifacts/android-ui/Nylo-QA-gallery.json /sdcard/Download/Nylo-QA-gallery.json
    ;;
  *) echo "Unknown Android UI scenario" >&2; exit 1 ;;
esac
printf 'Scenario: %s\n' "$scenario" >> artifacts/android-ui/provenance.txt
if [ "$scenario" = sdk ]; then
  bash scripts/android/prepare-gesture-input.sh
  python3 -u scripts/android/gesture-input-server.py > artifacts/android-ui/native-gesture-input.log 2>&1 &
  nylo_gesture_pid=$!
  python3 - <<'READY'
import socket, time
for _ in range(50):
    try:
        with socket.create_connection(('127.0.0.1', 8766), timeout=1):
            break
    except OSError:
        time.sleep(.1)
else:
    raise SystemExit('Native input test bridge did not start')
READY
fi
export UI_BUILD_MARKER=""
if [ -f artifacts/android-build/build-identity.json ]; then
  export UI_BUILD_MARKER="$(python3 -c 'import json; print(json.load(open("artifacts/android-build/build-identity.json"))["marker"])')"
fi
"$RUNNER_TEMP/android-maestro/maestro/bin/maestro" test -e "UI_BUILD_MARKER=$UI_BUILD_MARKER" --test-output-dir "$PWD/artifacts/android-ui" --format junit --output artifacts/android-ui/results.xml "$flow"

# Retain real system-navigation and composer bounds after the keyboard is dismissed.
adb shell uiautomator dump /sdcard/nylo-navigation.xml
adb pull /sdcard/nylo-navigation.xml artifacts/android-ui/navigation-hierarchy.xml
# UIAutomator returns only the active app window on this API35 emulator;
# SystemUI navigation is a separate window. Retain the real InsetsState too.
adb shell dumpsys window displays > artifacts/android-ui/navigation-window-insets.txt
python3 scripts/android/check-navigation-insets.py artifacts/android-ui/navigation-hierarchy.xml "$mode"

if [ "$scenario" = sdk ]; then
  # Disposable google_apis CI emulator only. Keep raw SQLite/WAL in RUNNER_TEMP.
  adb root
  adb wait-for-device
  adb shell am force-stop com.nylohq.nylo
  mkdir -p "$RUNNER_TEMP/nylo-sdk-db"
  for suffix in '' '-wal' '-shm'; do
    remote="/data/user/0/com.nylohq.nylo/files/SQLite/nylo.db$suffix"
    if adb shell test -f "$remote"; then
      adb pull "$remote" "$RUNNER_TEMP/nylo-sdk-db/nylo.db$suffix"
    fi
  done
  python3 scripts/export-sdk-documents.py "$RUNNER_TEMP/nylo-sdk-db/nylo.db" artifacts/android-ui
fi
