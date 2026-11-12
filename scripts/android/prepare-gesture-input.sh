#!/usr/bin/env bash
# Compile a shell-UID input test helper, never the application or its native modules.
set -euo pipefail
nylo_gesture_dir="$RUNNER_TEMP/nylo-gesture-input"
mkdir -p "$nylo_gesture_dir/classes" "$nylo_gesture_dir/dex"
nylo_android_sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
test -n "$nylo_android_sdk"
nylo_android_jar="$(find "$nylo_android_sdk/platforms" -name android.jar | sort -V | tail -1)"
nylo_android_d8="$(find "$nylo_android_sdk/build-tools" -name d8 | sort -V | tail -1)"
javac -source 8 -target 8 -classpath "$nylo_android_jar" -d "$nylo_gesture_dir/classes" scripts/android/NyloGestureInput.java
"$nylo_android_d8" --lib "$nylo_android_jar" --min-api 26 --output "$nylo_gesture_dir/dex" "$nylo_gesture_dir/classes/NyloGestureInput.class"
adb push "$nylo_gesture_dir/dex/classes.dex" /data/local/tmp/nylo-gesture-input.dex
