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
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
curl -fsSL --retry 3 --retry-all-errors --retry-delay 3 --retry-max-time 120 --connect-timeout 15 --max-time 60 https://github.com/mobile-dev-inc/Maestro/releases/download/cli-2.12.1/maestro.zip -o "$RUNNER_TEMP/android-maestro.zip"
echo "54dbb0716425626604973cbb374c585ca30272375d9ce15177a1152765ddd9d7  $RUNNER_TEMP/android-maestro.zip" | sha256sum -c -
unzip -q "$RUNNER_TEMP/android-maestro.zip" -d "$RUNNER_TEMP/android-maestro"
export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_DRIVER_STARTUP_TIMEOUT=300000
"$RUNNER_TEMP/android-maestro/maestro/bin/maestro" test --test-output-dir "$PWD/artifacts/android-ui" --format junit --output artifacts/android-ui/results.xml e2e/android-smoke.yaml
