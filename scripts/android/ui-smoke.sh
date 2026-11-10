#!/usr/bin/env bash
# Project CI test runner, never a substitute for supported interactive device tools.
set -euo pipefail
mkdir -p artifacts/android-ui
collect() {
  adb logcat -d -t 2000 > artifacts/android-ui/logcat.txt || true
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
export UI_BUILD_MARKER=""
if [ -f artifacts/android-build/build-identity.json ]; then
  export UI_BUILD_MARKER="$(python3 -c 'import json; print(json.load(open("artifacts/android-build/build-identity.json"))["marker"])')"
fi
"$RUNNER_TEMP/android-maestro/maestro/bin/maestro" test --test-output-dir "$PWD/artifacts/android-ui" --format junit --output artifacts/android-ui/results.xml "$flow"

# Retain real system-navigation and composer bounds after the keyboard is dismissed.
adb shell uiautomator dump /sdcard/nylo-navigation.xml
adb pull /sdcard/nylo-navigation.xml artifacts/android-ui/navigation-hierarchy.xml
# UIAutomator returns only the active app window on this API35 emulator;
# SystemUI navigation is a separate window. Retain the real InsetsState too.
adb shell dumpsys window displays > artifacts/android-ui/navigation-window-insets.txt
python3 scripts/android/check-navigation-insets.py artifacts/android-ui/navigation-hierarchy.xml "$mode"
