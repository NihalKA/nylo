# AI SDK mobile capabilities: delivered beta 29

App source: `ca48da21ec171b8001576f7489c7faed25d9f057` on
`feat/ai-sdk-mobile-capabilities`.
[PR 6](https://github.com/NihalKA/nylo/pull/6) remains open and unmerged.
Documentation-only follow-up commits do not change the delivered app inputs.

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
