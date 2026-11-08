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
