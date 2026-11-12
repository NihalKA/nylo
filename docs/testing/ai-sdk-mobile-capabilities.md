# AI SDK mobile capabilities: delivered beta 30

App source: `5b955b457918fb34e1c5137fb23a5fdcd9f76fa2` on
`feat/ai-sdk-mobile-capabilities`.
[PR 6](https://github.com/NihalKA/nylo/pull/6) remains open and unmerged.
Later test-only changes through `6b78b461e875a4e0470140f82812d3de5db46fec`
leave app inputs unchanged. The branch includes main `19c3c44`.

## Delivery

- iOS **1.0.0 (30)** built and uploaded successfully; Apple processing is **VALID**.
  Only this new build was added to the existing internal **Nylo Device QA** group.
  Independent group, build-beta-detail and notes reads confirm **IN_BETA_TESTING**,
  exact English notes and all-build access false. Prior selected builds, including
  29 and 27, remain available. Build 28 remains unassigned. Installation unverified.
- Android **1.0.0 / versionCode 30** is published as a new feature prerelease:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-30/Nylo-test.apk)
  · [checksum](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-30/SHA256SUMS.txt).
  The public APK and checksum were downloaded without authentication and match
  the audited binary. The release tag targets the exact app source. Older releases
  27/28/29 remain untouched. No Play upload.

## Approved reliability changes

Previously, retry could discard completed files or partial text, and a whole-turn
cutoff obscured whether work was still active. Retry now preserves those messages,
including repeated failure and cold restart. When generated files already exist,
**Retry text reply (keep files)** requests only the unfinished reply, disables
file/image/search tools for that retry and does not resend generated pixels.
A new explicit request can still create or edit files with ordinary consent.

Progress displays the current stage and elapsed time. Idle limits are model/reply
120 seconds, image 300 seconds, document/saving 60 seconds and approval 180 seconds,
with a finite 600-second total cap. Stream activity renews idle time only. User
Stop, background denial/expiry, idle/total timeout and storage failure have distinct
messages; stale pending action labels are removed. The native iOS background lease
is unchanged and finite. This does not provide unlimited background execution or
a durable server job.

A single-file-only request can finish after successful save when the model marks
that file tool as its final action, avoiding an extra reply-generation call.
Other requests retain the bounded multi-step loop. Error diagnostics retain only
static SDK labels, numeric HTTP status and allowlisted provider codes, including
noncanonical SSE error frames. Error bodies are capped at 8 KiB, parsed and
discarded; arbitrary provider messages, URLs, headers and credentials are not
copied into chat/storage. Automatic retries remain disabled.

These changes were owner-approved after a what/why/how explanation. Model and
reasoning defaults, provider storage (`store:false`), protocol, keys, consent,
foreground memory approval and backend/background architecture were not changed.
The exact reported live LB edit failure remains **unreproduced**; safe diagnostics
and upload-boundary regressions do not prove that its server-side cause is fixed.
No paid/live provider probe was made in this reliability pass.

## File capabilities retained

Pinned AI SDK Core/provider packages run on-device using the saved connection.
There is no additional backend or implicit Vercel gateway.

- Ordinary chats and agents can generate images and edit approved images. Edits
  append actual Expo Files to multipart forms rather than rejected URI-only
  records. The installed encoder and a local HTTP multipart regression verify
  that boundary. Generated files persist and have save/share controls.
- Model-callable `create_document` creates real local **PDF** and **TXT** chat
  attachments. Cards show filename/type/size. PDFs support headings, lists and
  simple tables, escape content and use no external scripts/assets. Generated
  PDFs and manual exports use native 36-point iOS margins; Android keeps its CSS
  margins. Manual response exports remain available.
- Web search provides source links when the selected API supports it and the
  capability is enabled. Access is not inferred from a model name.

The five-step loop remains bounded to two images and two documents per message.
Other document/archive/audio/video creation formats are not enabled. Existing
report opt-in, memory, consent, theme and storage behavior are preserved. Owner
root package/dashboard/output files were not changed by this pass.

## Verification

| Check                               | Actual result                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| App source CI `43173080185`         | 124 tests, typecheck, formatting, security, fonts/assets and Expo Doctor pass                |
| Final test-fixture CI `43183712582` | Pass; app inputs unchanged from 5b955b4                                                      |
| Both-platform Hermes exports        | Pass                                                                                         |
| iOS simulator `43173183196`         | Pass; source 5b955b4, stamp 2026-11-12T07:09:25Z                                             |
| Signed iOS/upload `43173192601`     | Pass, build 30; actual source/signature/certificate/profile audits pass                      |
| iOS privacy                         | 12 manifests; required SDK declarations; no microphone/tracking; exempt encryption           |
| iOS SDK `43176651978`               | Pass, original native/JS bundle; all 5 scenario captures plus launch inspected               |
| iOS background/retry `43183719350`  | Pass, original native/JS bundle; all 10 scenario/setup captures plus launch inspected        |
| Android signed `43173188315`        | Pass, versionCode 30; actual source/ZIP/bundle/assets/signature/permissions/hash audits pass |
| Android SDK `43175407929`           | Both navigation modes pass first attempt; all 10 captures inspected                          |
| Android smoke `43175473451`         | Both modes pass; all 30 passed captures inspected                                            |
| Actual native PDF/TXT               | Both platforms: created, persisted, cold-reopened, safely extracted and inspected            |

All **57 final native captures** were inspected. The actual iOS PDF is readable
and unclipped, one-page A4, minimum text X 48.64 pt and Y 36.22 pt. Android PDFs
were rendered and inspected in both navigation modes, with matching TXT content.
Only known synthetic documents are exported; no raw database is published.

The SDK scenarios exercise actual Hermes execution, streaming/tools, Expo
multipart encoding, local document writers and persisted files with synthetic
fetch. The iOS background scenario uses an owned localhost TLS server and real
native requests. It verifies output produced and durably saved while on Home,
no background memory approval, explicit Stop and cold restoration. Its image
regression creates exactly one synthetic image, deliberately fails the following
reply with a safe `server_error`, then retries only text. The fixture requires
three model calls and one image call, no file/search tools on retry, the same
stored image after restart and no private error-detail tag in persisted messages.
Actual captures show the stage/elapsed footer and file before/after retry.

Android smoke needed one bounded failed-job retry after a confirmed initial ADB
disconnect before app launch; the retry passed. Intermediate iOS background runs
stopped at observed system password/provider-sheet navigation, pending TLS trust
or owned-fixture startup. Retained screenshots/diagnostics led to test-only
corrections: semantic prompt handling, TLS preflight/trust logs and bounded
startup/liveness checks. Exact functional assertions were retained. Their results
are not counted as app background failures or passes. The final passed run uses
JS refresh **false** and independently verified app identity. No native rebuild
was used for these test-only corrections.

## Hashes and release boundaries

- APK SHA-256: `1d74d6c8873ba242bdb4f7475da920b43930c1361b8e16cc622bd88e9b123bdd`.
- IPA SHA-256: `a9ef1b9e0293498753237c3353d330b0ab88bf56ee6b8a5f6190b0d30f4b4f92`.

Only this pass's temporary feature signing policy 66418697 was removed;
independent readback confirms all other policies unchanged. The delivery
continuation is disabled with no next run. The separate four-hour App Review
monitor, Store 15, external 17, unrelated roles/testers and signing are untouched.

Physical installation, live mobile provider use, VoiceOver, OS save/share and
physical-device background expiry are unverified. The finite iOS lease remains
subject to OS limits. Production npm audit retains three moderate Expo transitive
findings with no high/critical findings. Earlier receipts and intermediate
failures are preserved in [the development record](ai-sdk-mobile-capabilities-development.md).
Private Apple receipts, handoff, logs, databases and credentials are excluded from
source/public releases.
