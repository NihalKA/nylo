## Current candidate11 — awaiting fresh UI acceptance

Product76b80dc, signed run42717464908, version code11, is building. It includes the verified maximum-text scrolling fix and literal per-screen Figma font/alpha/picker corrections. Its own automatic two-navigation-mode smoke, rich gallery, actual binary identity/certificate/permissions/font audit and normal-size screenshots are required before publication. No current APK11 public link is claimed.

Interim Android10 run42708462498 and both smoke/gallery modes are fully verified; its original three-button device-offline attempt is preserved. Those binaries are not released as final76. The next exact tested APK/AAB and checksums must come from native11, retaining the same original signing identity.

## Interim candidate10 — verified, not released

Productbe35483 corrects Shared Context markers/role labels/emphasis and heading weight found in the nine-screen comparison. Signed native42708462498 builds version code10. Smoke42711110409 ultimately passes108/12 in both modes after one failed-job-only three-button infrastructure retry; all30 PNGs and real33px clearance verify. Rich gallery42712767113 passes92/2 in each mode with all26 PNGs inspected, including actual shaded context emphasis. Full archive/Git fixture hashes, CRC, native identity/protected certificate/permissions and11 font assets match the exact APK. No candidate10 release or public download is claimed. Candidate9 below is interim evidence; its successful gallery42706856228 has been fully inspected and is recorded in the current parity audit.

## Current Figma candidate9 — not released

Product43dc70d / signed42702271410, version1.0.0/code9. Automatic UI42704383840 passes both real navigation modes:108 completed commands and12 conditional skips each, all30 PNGs inspected. Full ZIP SHA256 matches GitHub digests, CRC and Git6039539 fixture hashes pass; independent WindowManager checks give33px composer clearance in each mode. Actual compiled audit retains the existing certificate `1c275e7b601979d4900ec482b1f41bdbcd8b3c63e6419d339beb465b9adae21b`, correct package, no debugging/microphone/broad media permission and pinned bundletool validation. All11 runtime font binaries in the actual APK exactly match corrected source hashes (Android resource names are obfuscated). Full downloaded APK+AAB archive digest/CRC passes.

APK57,974,134 bytes, SHA256 `5863559f33faa38cf7982125f4397901596297281c1b604b351093de2ea3f728`; AAB40,357,012 bytes, SHA256 `ba3a6a4db0161c10870dd34ab927d7bd12d65067fc978a18f2dc11ab84f8db2c`. Both smoke provenance hashes match that exact APK. Evidence: ignored `artifacts/android-delivery-9` and `artifacts/figma-current/android9-{gestural,threebutton}/verification.json`.

Populated gallery42705388014 uses the same signed9 binary through normal backup import to cover the remaining design states. First three-button attempt fails at launch with actual adb device-offline/driverUNAVAILABLE, before app content executes; only that failed job was retried. First gesture attempt executes the narrowly scoped Pixel Launcher close branch, picks the owned backup and confirms Restore, then fails checking the below-viewport success notice without scrolling; actual screenshot shows two restored connections. Three-button retry executes normal restore and fails at that same offscreen notice (16 completed/2 skips/1 failed; three PNGs inspected). Corrected gallery42706856228 on fixture807ad5c scrolls to the same exact notice before its unchanged assertion and passes on native9;89 commands/2 skips gesture,93/1 three-button,25 PNGs inspected total, exact archive/fixture hashes and actual navigation geometry verified. Original accounting remains failure. Full current parity acceptance and publication are still pending.

# Android build and testing path

## Current download — Figma Warm Edition, build6

[Download the new Android APK](https://github.com/NihalKA/nylo/releases/download/android-beta-1.0.0-6/Nylo-test.apk) · [Release and checksum](https://github.com/NihalKA/nylo/releases/tag/android-beta-1.0.0-6). This is the redesigned version, source23cd656/native42682173057, version1.0.0/code6,56580814bytes, SHA256 `6c3666b7ac9a86f27e02c28ff1853dd5d40661d6865969fbf6a9f4fad1aa2d27`. Public release-asset hash matches both exact native UI-test APKs; unauthenticated download200 verified.

AndroidUI42686446060 passes gesture and three-button modes,100 commands/11 conditional skips each, with all28 captures inspected. Final composer bottom is2294 versus gesture bar top2337; three-button composer bottom2231 versus navigation top2274. These43-pixel clearances and model/attachment bounds were independently rechecked against actual native WindowManager InsetsSource records. Keyboard-open, dismissed, tabs and menu captures were reviewed. Compiled identity, protected release certificate, permissions and Google bundletool pass. Physical camera/picker/TalkBack/live-provider checks remain separate; generation remains foreground-only. The earlier code5 release below is historical and preserved.

**Mobile download:** [Nylo-test.apk](https://github.com/NihalKA/nylo/releases/download/android-beta-1.0.0-5/Nylo-test.apk). Open or share this public HTTPS link from the phone; T3 desktop file access and GitHub sign-in are not required. The [GitHub test prerelease](https://github.com/NihalKA/nylo/releases/tag/android-beta-1.0.0-5) includes SHA256SUMS.txt. Its release-asset digest exactly matches the already-tested APK; unauthenticated download headers return200 with56,579,174bytes. Source tag points to20efaf2. Evidence: `artifacts/android-delivery-5/public-download-verification.json`. No Google Play purchase/publication.

Nylo shares its Expo/React Native app code with iOS. The new Android workflow builds an installable signed APK and signed release AAB on standard GitHub Ubuntu runners. It does not purchase a Play account, upload to Google Play or establish store approval. Native/UI acceptance and the test-artifact delivery are recorded below; this is not Play approval.

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
