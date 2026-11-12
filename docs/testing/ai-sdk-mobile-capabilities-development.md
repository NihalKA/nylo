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

## Delivered build 29 and reliability-30 development record

The following snapshot preserves earlier delivery and intermediate failures.
The current delivery receipt is in `ai-sdk-mobile-capabilities.md`.

# AI SDK mobile capabilities: delivered beta 29

App source: `ca48da21ec171b8001576f7489c7faed25d9f057` on
`feat/ai-sdk-mobile-capabilities`.
[PR 6](https://github.com/NihalKA/nylo/pull/6) remains open and unmerged.
Build 29 corresponds to the app source above. Later branch changes recorded below
are not included in those delivered binaries.

## Delivery

- iOS **1.0.0 (29)** built and uploaded successfully. Apple processed it **VALID**.
  Assigned only this new build to the existing internal **Nylo Device QA** group.
  Independent group/build reads confirm the exact build and **IN_BETA_TESTING**;
  English test notes were independently read back. Prior group builds, including
  27, remain available; all-build access remains false. Installation is unverified.
- Android **1.0.0 / versionCode 29** is published:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-29/Nylo-test.apk).
  The unauthenticated public APK and published checksum were downloaded and match
  the audited binary. Existing releases 27/28 were not overwritten. No Play upload.

## Capabilities and repair

Pinned AI SDK Core/provider packages execute on the device using the saved
connection, key, protocol and model. There is no additional backend or implicit
Vercel gateway. Existing attachment consent, memory approval, report opt-in,
storage and background-response policies are preserved.

- Ordinary chats and agents can generate images and edit approved images.
  Results persist in blob storage, survive restart and have save/share controls.
- The model-callable `create_document` tool creates real local **PDF** and **TXT**
  attachments on mobile. File cards show filename/type/size and save/share controls.
  PDFs support headings, lists and simple tables; content is escaped and uses no
  external assets/scripts. Manual response exports remain available.
- Web search produces source links when supported by the selected API and enabled
  capability. No account capability is inferred from a model name.
- The existing five-step loop is bounded to two images and two documents per user
  message. Document title/content limits are validated. Generated pixels are not
  resent in ordinary follow-up messages. Automatic retries remain disabled.

The reported edit failure exposed an upload boundary missed by the original
synthetic fetch: Expo rejects React Native URI-only multipart records. Native
edits now append actual Expo Files. A regression reproduces the original
rejection using the installed Expo encoder, then sends corrected bytes to a
local HTTP server for multipart parsing. The native SDK diagnostic checks the
real encoder too. Unknown failures no longer guess that quota or access caused
them; actual HTTP failures retain their status-specific messages.

Visual PDF review also caught iOS ignoring CSS page margins. Generated PDFs and
manual exports now supply native 36-point margins. The final iOS PDF was rendered
and inspected: one-page A4, readable and unclipped, minimum text Y **36.22 pt**
(previous candidate: 0.22 pt). Android's actual A4 output was also rendered and
inspected. PDF/TXT samples are extracted only from the known synthetic CI chat;
no raw database, credentials or user conversation is published.

Other document/archive/audio/video creation formats are not enabled by this
change. Feature access still depends on the configured API/model/account.

## Verification

| Check                                 | Actual result                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Source CI `43161649821`               | 114 tests, typecheck, formatting, security, fonts/assets and Expo Doctor pass                             |
| Both-platform Hermes exports          | Pass                                                                                                      |
| iOS simulator `43161673458`           | Pass, exact source ca48da2                                                                                |
| Signed iOS build/upload `43161680755` | Pass, 1.0.0 (29); actual identity/signature/certificate/profile audits pass                               |
| iOS privacy                           | 12 manifests, required SDK declarations, no microphone/tracking, exempt encryption                        |
| iOS SDK `43163614819`                 | Pass, unchanged built native/JS bundle; all 5 scenario captures plus launch inspected                     |
| Android signed build `43161676923`    | Pass, versionCode 29; actual source/ZIP/bundle/assets/signature/permission/hash checks pass               |
| Android SDK `43163084265`             | Both modes pass first attempt; all 10 captures inspected                                                  |
| Actual native PDF/TXT                 | Both platforms: created, persisted, cold-reopened and safely extracted; PDF text/render and TXT inspected |
| iOS normal smoke `43159852937`        | Source 476286c UI baseline: pass, all 15 scenario captures plus launch inspected                          |
| Android normal smoke `43159430534`    | Source 476286c UI baseline: both modes pass, all 30 functional captures inspected                         |

Candidate 29 changes only native PDF margin options from the fully tested UI
baseline. Its final SDK runs use exact candidate-29 binaries and exercise the
changed output. No full native rebuild was used for test-only changes.

The offline SDK scenario exercises actual Hermes streaming/tool execution,
image generation/edit code with synthetic fetch and real multipart encoding,
local document/export writers, file cards, persisted blobs and cold reopen.
It makes no provider request. Earlier computer SDK integration generated a
visually inspected image through the selected connection and returned web-search
sources; this is distinct from live mobile provider execution.

The earlier build-28 gestural SDK lost emulator transport before app launch; its
single failed-job retry passed. A Pixel Launcher ANR diagnostic was retained with
the passed Android smoke evidence. Candidate-29 SDK runs passed without retry.
An intermediate iOS margin diagnostic was cancelled by the shared workflow
concurrency group when the exact-build run was dispatched; no pass/fail claim is
made from it. Final iOS evidence comes from `43163614819` with JS refresh disabled.
iOS 28 remains unassigned because its actual PDF review found missing margins.

## Binary hashes and boundaries

- APK SHA-256: `6b9c2b9b1402e8a9c6fa6c3988a396a06d4c96cf144d511bf5c413aaa440f55f`.
- IPA SHA-256: `74b96bdae47dfb93d8680902025dd90d35aa2c8c4213d690a9e7bbf114a5e18e`.

Only temporary feature signing policy 66408002 was removed after delivery;
independent readback confirmed the other policies unchanged. Store 15, external
17, unrelated roles/testers/signing and the separate four-hour App Review monitor
were not changed. This delivery continuation is disabled with no next run.

Live mobile provider use, physical installation, VoiceOver and OS save/share
interaction are unverified. Production npm audit retains three moderate Expo
transitive findings, with no high/critical findings. Earlier receipts are kept in
[the development record](ai-sdk-mobile-capabilities-development.md). Private Apple
receipts, logs, databases and credentials are excluded from source/public releases.

## Theme follow-up on current main

The feature branch already includes freshly fetched `origin/main` at
`19c3c440acf4cf7f8089929ae5f4048f5aec4198`. Its theme tokens, shared UI styles,
typography, main screens and brand assets match main. No rebase was needed.
The SDK feature did change completed action-label text from main's green to gray;
this follow-up restores green for completed labels and matches error/pending text
to the existing icon colors. Formatting and typecheck pass. This small UI change
has not yet been verified in a new native build or distributed.

## Approved reliability follow-up (not released yet)

Retry preparation now preserves interrupted files and partial text. When files
already exist, the retry requests only the unfinished text reply, disables file
creation/edit/search tools for that retry, and retains the original file messages
in storage. Generated pixels are not resent. A new explicit user request can
still create or edit a file with normal consent.

The former three-minute whole-turn cutoff is replaced by idle limits: model/reply
120 seconds, image 300 seconds, document/saving 60 seconds, approval 180 seconds,
with an absolute ten-minute cap. Network activity renews idle waits, never the
total cap. Stop, background denial/expiry, idle/total timeout and storage failure
have distinct messages. Current-stage/elapsed UI and removal of stale pending
actions clarify progress. Native background permission remains finite; no new
backend, provider storage, model/default reasoning change or automatic retry.

File tools support ending a file-only turn immediately after a successful save
when the model explicitly identifies that no further work is needed. Other
requests retain the existing bounded multi-step loop. SDK and provider failures
show only static diagnostic labels, numeric HTTP status and allowlisted codes;
arbitrary messages/bodies/headers/URLs/credentials are not copied to chat.
Known error codes in noncanonical LB error frames are retained safely without
loosening successful-response validation. The exact reported live edit failure
has not been reproduced with a paid provider request.

124 tests/typecheck/format/security/fonts/assets and both Hermes exports pass.
Regressions cover repeated/cold-restart file retries, interruption budgets,
redacted real-SDK stream errors, one-call file completion, and approved editing
of an image saved by an interrupted turn. The local background fixture now emits
current SDK-compatible Responses frames; its Home/Stop assertions expect the
specific new interruption messages. Native verification and a new beta remain
pending. Delivered build 29 is unchanged.

Candidate-30 native builds and signing audits pass on app source `5b955b4`.
iOS SDK `43176651978` and Android SDK `43175407929` pass; all 6 iOS and 10 Android
captures and actual native PDF/TXT outputs were inspected. iOS retains its native
36-point PDF margins. Android smoke `43175473451` passes both navigation modes;
all 30 captures were inspected. One failed-job retry followed a confirmed initial
ADB disconnect before the three-button app launch.

The first iOS background test `43176656145` stopped before response testing because
the provider sheet remained open after dismissing the system password prompt.
Retained captures/accessibility state identify the visible Done control. The
correction is test-only: close that observed sheet semantically and retain the
strict Home/Stop/file-retry assertions. Corrected run `43178705293` reuses the same
native binary with JS refresh disabled. It must verify finite background
completion, foreground-only memory approval, user Stop, and a deliberately failed
post-image reply followed by text retry without image regeneration. Distribution
of candidate 30 remains on hold pending that result and capture review. No new
app behavior or native build was introduced by the test correction.

The corrected navigation run `43178705293` reached response send but failed its
first-byte assertion before any Home/background case. Its actual screenshot shows
Waiting for the model with elapsed progress; native network diagnostics show TLS
trust evaluation pending and no HTTP request reached the owned fixture. Test-only
`a68f072` adds host TLS readiness/certificate preflight and simulator trust
diagnostics, retaining the exact response assertion with a bounded readiness wait.
Diagnostic `43180823900` reuses native 30 with refresh disabled. This is not proof
of an app background failure or a provider fault; distribution remains held.

TLS diagnostic `43180823900` passed its host certificate/health preflight but
stopped at an earlier system Save Password prompt, confirmed by the retained
screenshot. It sent no model request. Test-only `be4cdd6` dismisses that observed
prompt before the exact Done assertion, while retaining the late-prompt guard
and all response assertions. Run `43182570399` uses the unchanged native 30.

Run `43182570399` stopped before UI testing because the owned TLS fixture did
not report ready within its 10-second startup deadline. The server process was
still alive; no functional app/background result is claimed. Test-only `6b78b46`
adds a bounded 60-second startup/liveness check and explicit startup diagnostics;
run `43183719350` reuses native 30 with all response assertions unchanged.
