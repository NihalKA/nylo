# Native privacy manifest inspection

8 November 2026. Inspected the actual Release simulator bundle from native run 42484246913, artifact 13618969848, source `24aaba22b4bcec417fd38212f3ea2b6a5793916e`. This is a dependency-manifest check on a simulator build, not the final signed release archive or an App Store privacy declaration.

Ten bundled `PrivacyInfo.xcprivacy` files were parsed: app root, ExpoConstants, ExpoFileSystem, React, SocketRocket, boost, folly, glog, React-cxxreact and React-timing. All declare `NSPrivacyTracking=false` and empty collected-data arrays. No tracking domains are declared.

| Required-reason API category | Declared reasons across manifests |
| --- | --- |
| User defaults | CA92.1 |
| File timestamp | C617.1, 0A2A.1, 3B52.1 |
| System boot time | 35F9.1 |
| Disk space | E174.1, 85F4.1 |

The dependency manifests describe bundled SDK behavior. They do not account for Nylo's user-initiated provider requests, provider retention, support correspondence or backup destinations; see `docs/PRIVACY_INVENTORY.md`. An empty SDK collection array does not justify a “Data Not Collected” store label.

Repeat inspection against the exact signed release archive and verify each declared reason against the final app's use before submission. No app configuration, package or asset changes occurred between this native seed and app source 9fc4d9a; that compatibility fact does not replace signed-archive verification.

## Expanded image dependency audit

The actual expanded simulator bundle from42503476277/c16471e, artifact13626439755, was downloaded and inspected. Its Info.plist has a camera purpose string, no photo-library/microphone purpose strings, minimumiOS16.4, iPhone device family1 and nonexemptencryption=false. Ten SDK manifests still parse with no tracking declarations. This is actual compiled evidence, not proof of runtime permission behavior or the final archive.

**Packaging issue found:** SDWebImage.framework is embedded but no SDWebImage privacy manifest appears in that bundle. Apple explicitly lists SDWebImage as requiring a manifest: https://developer.apple.com/support/third-party-SDK-requirements/ . The precompiled ExpoImageManipulator SPM configuration pins SDWebImage5.21.6/WebPCoder0.15.0; the vendor's5.21.6 manifest is in WebImage/PrivacyInfo.xcprivacy (Resources is a symlink), declares no tracking/collection and FileTimestampC617.1.

The follow-up uses Expo's documented `expo.autolinking.ios.buildFromSource` for the image module/dependencies and pins the matching CocoaPods source versions using a guarded idempotent config plugin. This lets the SDK's original resource manifest be bundled; no invented SDK declaration is substituted. Source-build behavior and the newly compiled manifest must be verified in CI. https://docs.expo.dev/guides/prebuilt-expo-modules/

`scripts/native-privacy-audit.py` now scans actual .app/IPA/ZIP permission strings and all privacy manifests, lists frameworks and rejects missing required SDWebImage resources or conflicting tracking/microphone declarations. The simulator lane runs it on the compiled app; the signed lane runs it on the exported IPA **before upload** and retains the report. This guard does not certify provider retention, final AppPrivacy labels, SDK signatures or AppReview approval. The previously inspected bundle correctly fails the strengthened SDWebImage gate; the new source-built bundle is pending.
