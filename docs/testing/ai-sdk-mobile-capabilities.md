# AI SDK mobile capabilities: delivered beta 33

Delivered beta33 app source: `1565c0cb20021e6473b9fe5edc8b637e88ee5e9e` on
`feat/ai-sdk-mobile-capabilities`. Test-only changes through
`4c58fb2f052f88c8482e562e2a232664b4d4fb45` and later documentation leave app
inputs unchanged. The original feature was merged in [PR 6](https://github.com/NihalKA/nylo/pull/6)
as main `2706b72`. This follow-up starts from that latest main.

## Delivery

- iOS **1.0.0 (33)** built and uploaded successfully. Apple processing is **VALID**.
  Only this new build was added to existing internal **Nylo Device QA**. Independent
  group, build-beta-detail and notes reads confirm **IN_BETA_TESTING**, exact
  English notes and all-build access false. Prior selected builds, including
  32/30/29/27, remain available. Builds 28 and 31 remain unassigned. Installation is
  unverified.
- Android **1.0.0 / versionCode 33** is a new public feature prerelease:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-33/Nylo-test.apk)
  · [checksum](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-33/SHA256SUMS.txt).
  Unauthenticated public APK and checksum downloads match the audited binary.
  The release tag targets the exact app source. Earlier releases remain intact;
  candidate 31 was never published. No Play upload.

## Approved chat and file improvements

**Image previews:** tap generated images, sent photos or selected photos before
sending to open the existing local preview modal. The image fits without cropping,
with filename, Close and Save/Share. The keyboard dismisses when opening from the
composer. Viewing uses the existing stored attachment URI, sends no provider
request and creates no new consent grant or storage record. No image zoom behavior
is added in this pass. Native SDK checks cover generated synthetic image taps;
separate native sent/draft personal-photo cases remain unverified.

**Generated-image editing:** choose **Allow edits in this chat** once to remember
permission for assistant-generated images in that chat and provider. **Edit once**
and **Not now** remain available. Personal uploads still require approval. The
local grant is scoped to chat, credential, destination and consent revision;
provider identity changes and Reset sharing approval revoke it. Imports strip
remembered permission. Foreground and abort guards still apply.

**Answers and sources:** native Markdown rendering supports headings, emphasis,
lists, tables, code, safe links and clickable citations. Activity collapses into
compact rows, and a Sources button opens a sheet with titles and domains. The
renderer does not execute source HTML or fetch remote images. Existing typography
and theme tokens are retained.

**Document previews:** tap generated PDF/TXT cards to open them locally inside
Nylo. Save/Share remains available. iOS PDFs use Quick Look; Android uses an
embedded native PdfRenderer view with scrolling and 100/200-percent zoom. It
stays in the existing React activity. Only app-owned temporary cache copies are
accepted, with cleanup after dismissal/view destruction and viewport-limited
bitmap caching. TXT uses a local text reader. No external document host is added.

These changes were owner-approved after a what/why/how explanation. Actual visual
review held candidate 31: its zoom label changed while page pixels did not, and
nested plain text reset heading/bold font inheritance. Candidate 32 corrects
intrinsic PDF paper measurement and inline inheritance. Final native captures
show actual page enlargement and proper emphasis. Intermediate evidence remains
in [the development record](ai-sdk-mobile-capabilities-development.md).

## Retained AI SDK and reliability behavior

Pinned AI SDK Core/provider packages run on-device using the saved connection;
there is no extra backend or implicit gateway. Ordinary chats and agents support
image generation and approved edits, real model-callable PDF/TXT creation, and
web search with sources when enabled and supported by the selected API. Image
edits append actual Expo Files to multipart forms; the real encoder and an owned
HTTP regression cover fixed-length and chunked upload boundaries.

`create_document` creates real persistent PDF/TXT attachments. PDFs support
headings, lists and simple tables, escape content and use no external scripts or
assets. Generated PDFs and manual exports use native 36-point iOS margins;
Android retains its CSS margins. Manual response exports remain available. The
five-step loop stays bounded to two images and two documents per message. Other
document/archive/audio/video creation formats are not enabled.

Retry preserves completed files and partial text across repeated failures and
cold restart. **Retry text reply (keep files)** disables file/image/search tools
for that retry and does not resend generated pixels. New explicit requests retain
ordinary capabilities and consent. A successfully saved single-file-only result
can finish without another model call when the model marks it final.

Visible progress shows stage and elapsed time. Idle limits remain model/reply
120 seconds, image 300 seconds, document/save 60 seconds and approval 180 seconds,
with a finite 600-second total cap. Stream activity renews idle only. Stop,
background denial/expiry, idle/total timeout and storage failure have distinct
messages. The native iOS lease remains finite; this is not unlimited background
execution or a durable server job. Automatic retries remain disabled.

Diagnostics retain only static labels, numeric HTTP status and allowlisted codes.
Error bodies are capped at 8 KiB, parsed and discarded; arbitrary provider
messages, URLs, headers and credentials are not stored in chat. The exact reported
live LB edit failure remains **unreproduced**. Synthetic native checks do not prove
live endpoint behavior. No paid/live provider probe was made.

## Verification

| Check                           | Actual result                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Source CI `43218473752`         | Pass: 128 tests, typecheck, format, security, fonts/assets and Expo Doctor                                         |
| Test-only CI `43223768537`      | Pass; app inputs unchanged from `1565c0c`                                                                          |
| Both-platform Hermes exports    | Pass                                                                                                               |
| iOS simulator `43218610664`     | Pass; source `1565c0c`, marker 2026-11-12T12:30:48Z; actual bundle/executable/assets/privacy verified              |
| Signed iOS/upload `43218623144` | Pass, build 33; actual signature, exact certificate/team/profile/source/hash verified                              |
| iOS privacy                     | 12 manifests, required declarations present, no microphone/tracking, exempt encryption                             |
| iOS SDK `43223840243`           | Pass, original bundle/refresh false; all 10 scenario captures plus launch reviewed                                 |
| Android signed `43218616369`    | Pass, versionCode 33; actual source/bundle/assets/ZIP/signature/permissions/hash verified; signer unchanged from32 |
| Android SDK `43223846414`       | Both navigation modes pass; all 22 captures reviewed                                                               |
| Unchanged background baseline   | Build 32 `43213196823` passes; all 14 captures reviewed; no background/protocol/memory implementation changes in33 |
| Unchanged main UI baseline      | iOS 31 `43206932619` and Android 31 `43206939702` pass; all 46 captures reviewed                                   |
| Actual native PDF/TXT           | All three final platform/navigation samples rendered, text-checked and visually inspected                          |

All **33 final candidate33 captures** were reviewed, separately from earlier
baseline captures. They show actual image pixels in the local preview, filename,
Close and Save/Share, return to the chat, PDF/TXT previews, proper Markdown and
Sources sheet, and retained files after cold restart. Android PDF zoom changes
actual page geometry and measured 200/100-percent accessibility states. Actual
PDFs are readable and unclipped, one page A4; iOS minimum text X 48.64 pt/Y 36.22 pt.
TXT contents match across platforms. Only known synthetic samples are exported;
no raw database is published.

The first Android run `43222023732` passed gestural mode, with all 11 captures and
PDF/TXT reviewed. Three-button mode stopped at the initial Save/share image
assertion before tapping: its screenshot/AX showed the chat scrolled below the
image, starting at the PDF card. Test-only `4c58fb2` adds a semantic upward scroll
to the image before the original assertion and tap on both platforms. Assertions
remain intact and app inputs are unchanged; the existing binaries were reused.
No app image-opening failure or pass is inferred from that failed initial case.
The final corrected run passes both modes without another retry.

SDK scenarios use actual Hermes, Expo encoding, local writers, preview modules
and persisted files with synthetic fetch. They do not prove live-provider
behavior. Build 32's explicitly retained owned-localhost TLS baseline verifies
Home completion, foreground-only memory approval, Stop, file-preserving text-only
retry without image regeneration or private error-detail storage, cold restoration,
and remembered generated-image edit permission after restart. Those implementations
are unchanged by the image preview wrappers; the case was not rerun blindly.

## Hashes and boundaries

- APK SHA-256: `f7d8fdbbe972b6deab2ed6da6babfb2b63de0ba862102699c1c445ec42d7fec5`.
- IPA SHA-256: `ccb8f2d30a4860542540fad6d1092eea2881341b9894c51c1241983c330bd0fa`.

Only this pass's temporary signing policy 66449512 was removed; independent
readback preserves the original two policy objects. The delivery continuation is
disabled with no next run. The separate four-hour App Review monitor, Store15,
external17, unrelated roles/testers and signing are untouched.

Theme, model/reasoning defaults, provider protocol/keys/`store:false`, foreground
memory approval, report opt-in and background architecture are preserved. Owner
root package scripts, dashboard and output were not changed. Physical-device
installation/expiry, live provider use, VoiceOver and OS Save/Share are unverified.
Production npm audit retains three moderate Expo transitive findings and no
high/critical findings. Private handoff, Apple receipts, credentials, SQL/databases
and logs remain excluded from source and public releases.

## Owner-approved follow-up: full-screen image gestures (pending new beta)

The owner reported that the fit-only image sheet did not zoom, and explicitly
approved a full-screen photo viewer with pinch zoom, bounded panning, double-tap
zoom/reset, Close and Save/Share. The new image-only modal uses a dark photo canvas,
safe-area controls, accessible zoom/reset actions, and local attachment data.
PDF/TXT previews and app-wide theme/provider/consent/background behavior stay as
before. The earlier proposed image-tool failure recovery change is not included.

Zoom is limited to1–5 times, anchored to the moving two-finger midpoint, and pan
bounds prevent blank edges. Touch-count changes rebase at the current pose to
avoid a jump when one finger lifts. Viewport changes and reopening reset the view.
The implementation adds no dependency or native module. Five new geometry cases
bring the source suite to133 passing tests; typecheck, formatting, security and
both Hermes exports pass. Native SDK flows now capture real double-tap zoom, pan
and reset on an owned patterned image; actual native results are pending. Native
pinch gesture observation must be reported separately from math/unit coverage.

Public build33 remains available at https://testflight.apple.com/join/u7zsCTuR
with external APPROVED/IN_BETA_TESTING independently verified. This pending viewer
upgrade has not yet replaced that released binary.
