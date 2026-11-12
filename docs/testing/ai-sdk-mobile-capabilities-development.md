# Development evidence history

These intermediate snapshots are superseded by [the current delivery record](ai-sdk-mobile-capabilities.md).

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
device success. Source verification currently has 105 passing tests.

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

Image arguments are also checked at execution time: the SDK's JSON-schema
wrapper otherwise describes arguments without validating them. Empty, missing,
non-string or oversized prompts and invalid image IDs are rejected before the
image API. The added regression checks that these cases make no image request;
all 105 source tests pass.

## Final candidate correction after Android 26

The corrected iOS SDK flow `43108878086` passed; its three captures show a
rendered synthetic image, successful local exports and restoration after cold
reopen. Standard compact and large smoke each passed, with all 30 captures
inspected. The maximum-text test's offscreen AX row is moved into the tappable
viewport by its profile-specific test navigation; exact content assertions remain.

Android 26 SDK run `43113374744` reached the image result, then failed reading
its exported text file with FileNotFoundException. Expo 58 declares File.write()
as asynchronous. Export/share, multipart image edits and backup export now await
writes before reading, uploading or sharing. Image/backup cleanup also encloses
the write. This corrects a concrete race; native 26 is superseded and remains
unassigned to QA. All 105 source tests and both-platform Hermes exports pass;
fresh native 27 verification and distribution are pending.

## Build 27/28 delivery and follow-up record before final margin verification

Historical snapshot recorded 2026-11-12. Candidate 29 delivery is recorded in the current testing document.

# AI SDK mobile beta delivery

The feature remains on `feat/ai-sdk-mobile-capabilities`, unmerged in
[PR #6](https://github.com/NihalKA/nylo/pull/6), from main
`19c3c440acf4cf7f8089929ae5f4048f5aec4198`.
Both distributed binaries use app source
`199e62fa7670706ebedcf5ca8dbbc9439aae80a4`; later commits change tests/docs only.

## Delivery

- Android **1.0.0 / versionCode 27** is published:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-27/Nylo-test.apk).
  The public APK and published checksum were downloaded and match the audited binary.
- iOS **1.0.0 (27)** was built, uploaded and processed **VALID**.
  Assigned to the existing internal **Nylo Device QA** group. Fresh group/build
  reads confirm the exact build and **IN_BETA_TESTING**; English test notes
  were saved and independently read back.
  Actual TestFlight installation is unverified.

## What changed

Pinned AI SDK Core/provider packages run directly on the device using explicit
provider objects, the saved connection/key and Expo fetch. There is no additional
backend or implicit Vercel gateway. Nylo retains protocol/model choice, attachment
consent, memory approval and background-response policy.

- Configurable image generation and approved edits, persisted images, save/share.
- Web-search source links when the selected API supports the configured tool.
- Local response text/PDF exports.
- Explicit capability settings and verification after successful use; account
  access is not inferred from a model name. Generated pixels are not resent in
  ordinary follow-up messages.

The tool loop is bounded, automatic retries are disabled, malformed image
arguments are rejected before the image API, and requests stay on the selected
connection. Native edits use Expo files for multipart data. Native writes are
awaited before uploading, reading or sharing; temporary output is cleaned up.

## Verification

| Check                                      | Actual result                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Source CI `43114718126`                    | 105 tests, typecheck, formatting, security, fonts/assets and Expo Doctor pass              |
| Both-platform Hermes exports               | Pass                                                                                       |
| iOS simulator build `43114728155`          | Pass, source 199e62f                                                                       |
| Signed iOS build/upload `43114738391`      | Pass, 1.0.0 (27); actual signature/certificate/profile/source audits pass                  |
| iOS privacy                                | 12 manifests, required SDK declarations present, no microphone/tracking, exempt encryption |
| iOS SDK `43118369361`                      | Pass on unchanged native/JS source; all 3 captures inspected                               |
| iOS large/maximum-text smoke `43118374422` | Both pass; all 30 captures inspected                                                       |
| iOS compact smoke `43120342832`            | Pass; all 15 captures inspected                                                            |
| Android signed build `43114732905`         | Pass, versionCode 27; APK/AAB signatures, source, permissions and downloaded hash verified |
| Android SDK `43117443285`                  | Both navigation modes pass; all 6 captures inspected                                       |
| Android smoke `43117447966`                | Both modes pass; all 30 captures inspected                                                 |
| Android gallery `43113384909`              | Earlier build 26 UI baseline: both modes pass; all 28 captures inspected                   |

The offline native SDK scenario exercises actual Hermes streaming and tool
execution, generation/edit code with synthetic fetch, local text/PDF files,
rendered image persistence and cold reopen. It sends no provider request. One
computer integration case also generated a visually inspected image through the
actual SDK and selected NyloHQ connection; SDK web search returned source links.
These are distinct from a live mobile provider or physical-device test.

The Android gestural SDK job passed its single retry after the first screenshot
showed a Pixel Launcher ANR. The first compact iOS attempt missed its initial
accessibility state; the targeted test adds a bounded wait for the same state.
Maximum-text navigation scrolls an offscreen row into the tappable viewport;
exact draft/memory restoration assertions remain. No native rebuild was used for
test-only corrections. Builds 25/26 were superseded and not assigned to QA.

The temporary feature-branch signing-environment policy was removed after delivery;
both pre-existing policies were independently verified unchanged. Store build 15,
external build 17, unrelated testers/roles/signing, and the separate App Review
monitor were not changed by this task. The delivery continuation is disabled.

## Binary hashes

- APK SHA-256: `078f0ee0851366fe8e012ac42c6cdcb812264f4408f4e924e8acc43ea1cd730e`.
- IPA SHA-256: `11267ea94df7deb0e37b7f14331662875de2b41d186b3f168539d3a087068d67`.

Provider feature access depends on the configured API/model/account. Physical
installation, VoiceOver and live mobile provider use are unverified. Production
npm audit retains three moderate Expo transitive findings, with no high/critical
findings. Historical development receipts are retained in
[the development record](ai-sdk-mobile-capabilities-development.md); private Apple
receipts, logs and credentials are excluded from source/public releases.

## Follow-up: image edits and document creation (not released yet)

The reported live edit failure exposed an upload boundary missed by the original
synthetic fetch: Expo fetch rejects RN URI-only multipart parts. Native edits now
append the actual Expo File. A regression executes the installed Expo encoder,
reproduces the old rejection, and sends the corrected bytes to a temporary local
HTTP server for multipart parsing. The native offline diagnostic now runs that
encoder too, checking the image bytes, filename and MIME header without a
provider request. The generic error no longer assumes access or quota failure.

The owner also requested a model-callable PDF/text creation tool. create_document
creates a real local file, persists it in existing blob storage, displays a file
card and supports save/share. PDF formatting supports headings, lists and simple
tables, with escaped HTML and no external assets. Generation is bounded to two
documents per turn with validated content/filename limits. Other document formats
are not enabled by this change. Manual answer exports remain available.

The expanded SDK scenario creates image/PDF/TXT results, cold-reopens them, and
exports only its known synthetic sample PDF/text from the disposable CI database
for rendering/content inspection. No raw database is published. These follow-up
changes are pending native verification and a new beta; build 27 is unchanged.

Follow-up candidate `476286c`: source CI `43157348781` passes all 114 tests,
typecheck, formatting, security, fonts/assets and Expo Doctor; both Hermes exports
pass. Native iOS `43157368418`, signed iOS `43157378858` (28), and signed Android
`43157372254` (versionCode 28) succeed. Actual signing/profile/privacy/source
receipts were inspected; the downloaded APK matches its audited SHA-256.

Android SDK `43159374329` passes in both navigation modes. All ten SDK
captures and all 30 normal-smoke captures from `43159430534` were inspected.
One additional Pixel Launcher ANR diagnostic was retained. The first gestural
SDK attempt lost its emulator transport at initial launch, before the SDK check;
one failed-job retry passed. The actual Android one-page A4 PDF was rendered and
inspected for readable, unclipped heading/table/list content; extracted PDF text
and TXT content match the sample. Native and tested source are exactly 476286c.

Android **1.0.0 / versionCode 28** is now published at
[the new feature APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-28/Nylo-test.apk).
The unauthenticated public APK download and published checksum match the audited
SHA-256 `5d1bbb1daa77cc361edf18db46d7deda52174cd8fda5a78bab29b848147e0a78`.
Build 27's release is unchanged.

iOS SDK `43159849456` passes on the unchanged native/JS source. All five scenario
captures and the native launch capture were inspected, including image/PDF/TXT
cards and cold reopen. Its actual PDF is one-page A4 and contains the expected
text. Visual review found that iOS ignored CSS page margins, leaving content too
close to the page edges. Expo's native print options are now given explicit
36-point margins for generated PDFs and manual PDF exports. This focused fix
requires a new candidate and actual PDF rendering verification. iOS large smoke
`43159852937` passes; all 15 scenario captures and the native launch capture were
inspected, with exact native/tested source 476286c verified. iOS 28 is VALID and uploaded but remains
unassigned; iOS 27 stays available to QA. No live mobile provider or physical
installation claim is made from these synthetic native tests.

Margin-fix candidate `ca48da2` passes source CI `43161649821` (114 tests and the
normal source checks), with both Hermes exports passing. Exact-source native
builds `43161673458`, `43161676923` and `43161680755` are in progress for candidate 29. Diagnostic `43162017142` reuses the existing source-476286c simulator binary
with source-ca48da2 JavaScript to verify the PDF correction early. Its provenance
must remain separate; final candidate-29 SDK verification will use its unchanged
built bundle. The old iOS PDF's measured minimum text Y was 0.22 points, supporting
the visual finding that native page margins were missing.
