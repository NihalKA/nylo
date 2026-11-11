# AI SDK mobile capability candidate

Feature branch `feat/ai-sdk-mobile-capabilities` starts from fetched main
`19c3c440acf4cf7f8089929ae5f4048f5aec4198`. No merge is authorized.

The app uses pinned AI SDK Core/provider packages directly on-device. Explicit
provider objects and an allowlisted fetch keep requests on the saved connection;
no Vercel gateway, extra backend, automatic capability probes or automatic
retries are enabled. Existing protocol selection, provider/attachment consent,
memory approval and native background-response policy remain owned by Nylo.

The candidate adds configurable image model/search settings, a bounded image
tool in ordinary and agent chats, approved image edits, persisted image results,
source links and local response text/PDF export. NyloHQ's known integration has
default image/search settings; account access remains unverified until success.
Other endpoints need explicit capability configuration. Generated pixels are not
included in normal follow-up model input.

React Native cannot construct a Blob from typed arrays. The image-edit adapter
therefore implements the SDK's image-model interface using Expo local-file
multipart uploads, cleans up those files, and retains the SDK's generation/tool
loop. It does not install a broad Node or Blob compatibility layer.

## Verification in progress

- Both platform JS/Hermes exports passed the initial SDK import gate.
- Source tests exercise actual SDK Responses, compatible Chat Completions and
  Anthropic Messages, fragmented SSE, memory tool results, image generation,
  denied edits, persistence/blob hydration, truncated-stream failure, cancellation,
  destination isolation and no retry on quota errors.
- `Live device check` includes an explicit offline diagnostic exercising the real
  SDK's streaming, generation and multipart-edit tool loop with synthetic data.
  It sends no network request and reads no real credentials or conversations.
- `sdk` scenarios extend the existing iOS/Android CI test runners. Runtime,
  source/binary identity, native output exports, signing, upload, Apple processing,
  internal tester availability and actual installation must be reported separately.

A passing source test or API check does not establish native behavior. CI and
release receipts will be recorded after the exact candidate is built and tested.

Computer integration verification: one synthetic user request ran through the actual
SDK and configured NyloHQ connection, producing one visually inspected image.
The only requests were Responses -> image generation -> Responses. This used
the existing member credential without exposing it; it does not establish native
device success. Source verification currently has 104 passing tests.

The streaming wrapper preserves the native Expo Response instead of constructing
a React Native Response from a ReadableStream. A regression test runs the offline
SDK diagnostic with a constructor that rejects stream bodies. Both-platform
Hermes exports pass after this correction; native runtime verification is pending.

## Native candidate 25 (not distributed)

Binary source `9c587ff6fef51cf6989441c0e16597d475db28e4` built successfully:

- Android signed run `43099563202`, versionCode 25. Packaged source/assets,
  release certificate, APK/AAB signatures and permission audit pass. Downloaded
  APK SHA-256 matches the audit:
  `7ff1565849d06e9213094954c4848b485caa749b782ce408727e7d5278e999f4`.
- iOS simulator run `43099557616` passed. Signed run `43099570443` produced
  version 1.0.0 (25); actual IPA source/assets/signing/privacy audits passed and
  App Store Connect upload was confirmed. Apple processing is VALID. QA availability and installation remain pending.
- Android smoke run `43101735327` passed both navigation modes on its single
  retry. The first attempt lost emulator connections; it did not establish an app
  failure. All 30 captures from the exact retry artifact IDs were inspected; draft,
  multiline keyboard, memory restoration and both navigation modes are visible.
- Android SDK run `43101729889` reached the offline diagnostic in three-button
  mode, but its final consistency check failed. The screenshot was inspected.
  This is unresolved native evidence; the candidate is not ready to distribute.

Diagnostic JS commit `1b7580a` adds failure counts and synthetic-only tool error
reporting. Runner commit `fc174a0` corrects JS-refresh provenance: audit the seed,
retain its receipt, embed a distinct JS marker, and audit the tested bundle.
Native dependencies still must match; an unrefreshed run still requires exact app
source. Native and refreshed JS identity are recorded separately. iOS SDK run
`43103570577` stopped before the diagnostic because Settings rows expose a
combined title/detail accessibility label. The SDK flow now matches that label.
Smoke run `43103576504` uses the same diagnostic JS with the existing simulator
binary. Refreshed runs do not certify the signed candidate as a whole.

The subsequent iOS SDK diagnostic `43106535673` reached the check and reported
three chat steps, two image calls, no file, correct final text, and two invalid
JSON responses. The captured screenshot/AX and SDK source identify a fixture
issue: React Native's constructed string Response exposes text()/json() but no
readable body, while AI SDK reads JSON through body.getReader(). Real requests
use Expo fetch responses. The synthetic JSON fixture now supplies both readers;
the source regression models an absent body stream as well as an unsupported
stream constructor. All 104 source tests and typecheck pass. Native revalidation
of the corrected fixture remains pending; no image-success claim follows yet.
Compact iOS smoke passed and its 15 captures were inspected. Standard large
smoke also passed; its capture review remains pending. Maximum-text navigation
is being retested with conditional scrolling; exact restoration assertions remain.
