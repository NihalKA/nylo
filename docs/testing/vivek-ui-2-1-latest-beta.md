# Latest Vivek UI 2.1 beta

The owner requested the latest `ui-update/2.1` for iOS and Android. The release incorporates commits `67b0adb` and `89392d7` after the earlier build 41. App and native inputs exactly match upstream `89392d7a9e23758e253697a10c00d9e789c74a3d`; no replacement UI was added. The new side navigation, icons, chat/agent changes and motion behavior are supplied by Vivek.

Signed source `781a6c4b77bcde5fe436b93e3e4fe6ff2c15cdd8` passed type checking, 167 tests, security checks, original font/assets checks and iOS/Android Hermes exports. These checks do not establish physical-device behavior or full visual parity.

## iOS 1.0.0 (42)

[Signed CI run 43486162610](https://github.com/NihalKA/nylo/actions/runs/43486162610) succeeded on attempt 2 after the first hosted macOS runner lost communication. The original diagnostics archive checksum and ZIP integrity were verified; actual IPA source, original certificate/profile/signature, privacy manifests and 57 design assets were verified. Apple processing is VALID, and the exact build is IN_BETA_TESTING in the existing internal QA and external public groups. English test notes and preserved prior build selections/group attributes/internal tester membership were independently read back.

Public install link: https://testflight.apple.com/join/u7zsCTuR

At the owner’s request, the existing public-group cap was increased to 50 testers and independently read back; all other group attributes were preserved. Two members were observed before build assignment. Physical installation is unobserved.

## Android 1.0.0 (42)

[Signed CI run 43486170531](https://github.com/NihalKA/nylo/actions/runs/43486170531) succeeded. Original artifact checksum/ZIP integrity, exact source marker, APK/AAB hashes, original signing certificate, package/version metadata, permissions and 57 design assets were independently verified. Version code 42 is higher than the current closed-test release 40.

The owner requested the existing Google Play closed-testing flow. Its existing Alpha track and release draft were inspected; the existing `Nylo closed test` list remains selected with 13 testers. Draft release name and English release notes were saved for build 42. The verified AAB is ready, but it has **not been uploaded, submitted for Google review, or made available to testers**. The computer-control tool disappeared after draft preparation; the fallback browser was rejected by Google sign-in. Restoring the original signed-in Chrome computer-control connection is required to finish.

Existing tester opt-in link: https://play.google.com/apps/testing/com.nylohq.nylo

The prior build 40 was observed available to selected testers. No new app, track or tester list was created. No production publication or public APK release was performed.

## Cleanup

The task's temporary Apple branch permission was removed with all other policies preserved. Temporary workflow branch allowances are removed by the documentation/cleanup commit; app and native inputs remain identical to the signed source. Original receipts remain private. No merge was requested or performed.
