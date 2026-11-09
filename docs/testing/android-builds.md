# Android build and testing path

Nylo shares its Expo/React Native app code with iOS. The new Android workflow builds an installable signed APK and signed release AAB on standard GitHub Ubuntu runners. It does not purchase a Play account, upload to Google Play or establish store approval. Native/UI validation and actual artifact delivery remain pending until CI succeeds.

Android signing is held only in the `android-release` GitHub environment. Its original JKS and password backup are outside the repository in the owner's private release configuration. Never print, commit or upload these files as build evidence. Preserve this key for subsequent APK updates. Each workflow run uses its increasing run number as versionCode. Before Play release reconcile any existing version codes, current Play target-API requirements and production signing/upload-key policy.

The APK and AAB must pass compiled package/version checks, apksigner and jarsigner verification, and a permission audit. Optional media uses OS file/photo pickers; microphone and broad media-library permissions are removed from the generated release manifest. Camera remains optional and HTTPS-only transport is retained. Those declarations do not establish picker/camera runtime behavior.

The Android device tool currently reports no local SDK/emulator. Heavy builds belong in CI, not on the8GBMac. Add CI emulator UI evidence for launch, navigation, provider setup, keyboard/draft persistence, memory, file/photo picker and camera-denial recovery before calling Android runtime-validated. Live provider, physical device and background execution remain separate. Android currently stops an in-progress response on backgrounding; no foreground service/notification or indefinite completion is claimed.
