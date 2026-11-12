# AI SDK mobile capabilities: delivered beta 32

App source: `cd9bd299de696b0a808f147c92158e6bcfff4770` on
`feat/ai-sdk-mobile-capabilities`. Test-only changes through
`2b486de550f979c1d7e7e672a2030c4fd07748c4` and later documentation leave app
inputs unchanged. [PR 6](https://github.com/NihalKA/nylo/pull/6) remains open and
unmerged. The branch includes main `19c3c44`.

## Delivery

- iOS **1.0.0 (32)** built and uploaded successfully. Apple processing is **VALID**.
  Only this new build was added to existing internal **Nylo Device QA**. Independent
  group, build-beta-detail and notes reads confirm **IN_BETA_TESTING**, exact
  English notes and all-build access false. Prior selected builds, including
  30/29/27, remain available. Builds 28 and 31 remain unassigned. Installation is
  unverified.
- Android **1.0.0 / versionCode 32** is a new public feature prerelease:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-32/Nylo-test.apk)
  · [checksum](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-32/SHA256SUMS.txt).
  Unauthenticated public APK and checksum downloads match the audited binary.
  The release tag targets the exact app source. Earlier releases remain intact;
  candidate 31 was never published. No Play upload.

## Approved chat and file improvements

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

| Check                                        | Actual result                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Source CI `43209621982`                      | Pass: 128 tests, typecheck, format, security, fonts/assets and Expo Doctor                    |
| Test-only CI `43212349779`                   | Pass; app inputs unchanged                                                                    |
| Both-platform Hermes exports                 | Pass                                                                                          |
| iOS simulator `43209826681`                  | Pass; exact source and 2026-11-12T11:31:04Z marker, bundle/executable/assets/privacy verified |
| Signed iOS/upload `43209837140`              | Pass, build 32; actual signature, exact certificate/team/profile/source/hash verified         |
| iOS privacy                                  | 12 manifests; required declarations present, no microphone/tracking, exempt encryption        |
| iOS SDK `43213191199`                        | Pass, original bundle/refresh false; all 9 scenario captures plus launch reviewed             |
| iOS background/edit permission `43213196823` | Pass, original bundle/refresh false; all 13 scenario/setup captures plus launch reviewed      |
| Android signed `43209832262`                 | Pass, code 32; actual source/bundle/assets/ZIP/signature/permissions/native PDF/hash verified |
| Android SDK `43212391282`                    | Both modes pass; all 20 captures reviewed, actual zoom and restored files verified            |
| Unchanged main UI baseline                   | iOS31 smoke `43206932619` and Android31 smoke `43206939702` pass; all 46 captures reviewed    |
| Actual native PDF/TXT                        | All three final platform/navigation samples rendered, text-checked and visually inspected     |

All **44 final candidate32 captures** were inspected, separately from the 46
unchanged-main-UI baseline captures. Actual PDFs are readable and unclipped, one
page A4; iOS minimum text X is 48.64 pt and Y is 36.22 pt. Android page pixels and
measured accessibility zoom both change at 200 percent and restore to 100 percent.
TXT contents match across platforms. Export is restricted to known synthetic
samples; no raw database is published.

SDK scenarios exercise actual Hermes, Expo multipart encoding, local writers,
preview modules and persisted files with synthetic fetch. The owned localhost
TLS background scenario uses real native requests. It verifies durable completion
while on Home, no background memory approval, explicit Stop, file-preserving
text retry, redacted error detail and cold restoration. Exactly one synthetic
image is generated for the retry case, with three model calls and no regeneration.
The separate edit-permission case grants once, cold-restarts, then edits again
without another popup. Exact request counts include two edit-model calls and two
real multipart edit uploads; the stored chat grant is independently asserted.

Android gestural needed one bounded failed-job retry after initial-launch ADB
transport failure at 4.364 seconds, before SDK checks or app captures. The retry
passed. An intermediate iOS Quick Look test expected Done although its actual AX
record exposed the native close identifier and full document text. The corrected
test waits for actual PDF contents and targets that identifier; its original early
transition screenshot is not counted as successful visual evidence. Strict
functional assertions were retained, and test-only changes reused native builds.

## Hashes and boundaries

- APK SHA-256: `1d775d9ce61571c127123f4f098b8b592a90a4fd8be068f6f50539460b370201`.
- IPA SHA-256: `747553f786087e5777ddc01443449613e40b8a4add8dd83874f64ccfc28a0d54`.

Only this pass's temporary signing policy 66438039 was removed; independent
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

## Approved follow-up: image tap previews (pending new beta)

The owner reported that tapping images did not open them and approved the same
local preview pattern as PDF/TXT. Sent photos, generated images and selected
photos before sending now open the existing preview modal, with a contained image,
Close and the existing Save/Share action. Keyboard dismissal makes the viewer
usable from the composer. Viewing uses the stored attachment URI without a provider
request, new permission grant or storage change. No zoom behavior is added in this
pass. Build32 remains the delivered beta until new native checks and delivery.
SDK flows now assert image open/content/Close and retained chat controls, with an
actual preview capture on both platforms. Local128 tests/typecheck and both
Hermes exports pass; native visual verification is pending.
