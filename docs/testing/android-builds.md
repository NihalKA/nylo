# Android build and testing path

Nylo shares its Expo/React Native app code with iOS. The new Android workflow builds an installable signed APK and signed release AAB on standard GitHub Ubuntu runners. It does not purchase a Play account, upload to Google Play or establish store approval. Native/UI validation and actual artifact delivery remain pending until CI succeeds.

Android signing is held only in the `android-release` GitHub environment. Its original JKS and password backup are outside the repository in the owner's private release configuration. Never print, commit or upload these files as build evidence. Preserve this key for subsequent APK updates. Each workflow run uses its increasing run number as versionCode. Before Play release reconcile any existing version codes, current Play target-API requirements and production signing/upload-key policy.

The APK and AAB must pass compiled package/version checks, apksigner and jarsigner verification, and a permission audit. Optional media uses OS file/photo pickers; microphone and broad media-library permissions are removed from the generated release manifest. Camera remains optional and HTTPS-only transport is retained. Those declarations do not establish picker/camera runtime behavior.

The Android device tool currently reports no local SDK/emulator. Heavy builds belong in CI, not on the8GBMac. Add CI emulator UI evidence for launch, navigation, provider setup, keyboard/draft persistence, memory, file/photo picker and camera-denial recovery before calling Android runtime-validated. Live provider, physical device and background execution remain separate. Android currently stops an in-progress response on backgrounding; no foreground service/notification or indefinite completion is claimed.

## First compiled result and correction

Run42591072975 generated signed APK and AAB, version1.0.0/code1/minSDK24/targetSDK36/compileSDK37. The final audit failed because Build Tools37 prints `V2 Signer: certificate SHA-256 digest` instead of the older `Signer #1` label. The actual APK's public certificate digest independently matches the protected release key. This is not a delivered or fully validated Android build.

The corrected audit accepts the current documented output while still requiring exactly one signer and exact equality to the protected APK/AAB certificate. The generated manifest also removes the observed unused SYSTEM_ALERT_WINDOW permission, keeps camera hardware optional and removes microphone/broad media access. Run42593037703(run5) contains these corrections. Earlier superseded queued runs and the known-obsolete run4 were cancelled; version codes are increasing and not reset. No other app's signing key was changed.

A successful current build automatically starts Android emulator validation using its exact signed APK on API35/Pixel6, with pinned Maestro and checksums. Google bundletool1.18.3 is pinned by its official release SHA-256 to validate the AAB. The initial smoke covers ordinary launch/navigation, setup, multiline keyboard/draft persistence, agent memory save/relaunch and composition. Android-specific selectors and platform behavior must be checked from actual PNG/AX/JUnit/logcat, not inferred from iOS. Photo/file/camera-denial, physical-device and live-provider paths remain additional acceptance work.

## Delivered test artifacts — 9 November 2026

Version1.0.0/code5 is available in `artifacts/android-delivery-5/Nylo-test.apk` and `Nylo-release.aab`. The APK supports64-bit Android7+ devices. Open the APK on the test device and permit installation from that specific download source if Android asks; do not disable Play Protect. The AAB is prepared for a future Play upload and cannot be installed directly. No Google Play purchase or publication occurred.

The original build42593037703 ended FAILURE because the compiled-audit parser did not recognize the current aapt boolean output. Its immutable binaries were reused without modification. Corrected actual-binary auditing, pinned Google bundletool validation and emulator42597230205 pass. The signed release certificate matches the protected original key. API35/Pixel6 flow completed100commands with11conditional skips; all14screenshots were inspected. Native Enter produced exact newline text, retained after cold restart; agent composition also retained its exact newline. Saved agent memory, navigation and keyboard dismissal pass. Evidence: `artifacts/android-ui-enter-5/verification.json`.

APK SHA256: `f674e56dd4b2692d4d4a4c6dd1973b2244a533b6fd78b03fbc060a6a55727cdc`.
AAB SHA256: `bd896fe2177486db8a0ab2665b983363ef2873457192780d2cd79bf034b38de6`.

This is an internal test delivery, not Play approval. Physical Android, TalkBack, actual photo/file/camera-denial and live provider flows remain unverified. Android remains foreground-only for generation.
