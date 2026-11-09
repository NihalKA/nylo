# PDF attachment removal and connection recovery

## Owner report — 9 November 2026

On feedback beta 1.0.0 (14), the owner attached a PDF and tried to send it using `gpt-6-astra`. Nylo reported that PDFs require Responses or Claude Messages. The owner also reported that Remove did not remove the PDF. The screenshot establishes a blocked draft with the file still attached; it does not establish provider/model PDF capability or the exact touch sequence. The private policy file is not used in automated tests or uploaded by this investigation.

The model ID is independent of the connection's wire format. Nylo's Chat Completions adapter intentionally rejects PDF input locally. Responses and Claude Messages can carry PDF content, but actual model/provider support must still be verified. Existing request admission and explicit provider/attachment consent remain unchanged.

## Source fix — `48466d9`

The attachment strip previously inherited React Native ScrollView's default `keyboardShouldPersistTaps=never`. Installed React Native source documents that this captures the first non-input tap when the keyboard is dismissible, instead of passing it to the child button. The owner subsequently confirmed that dismissing the keyboard with the down-chevron first makes Remove work on build 14. This narrows the physical report to keyboard interaction; a current native regression is still required before claiming the fix passes.

- Attachment-strip taps now reach Remove while the composer is focused. The strip sizes to its content instead of growing into unused space.
- Remove updates the current draft reference, clears the obsolete send error and persists immediately. Text stays intact, and navigation/background saves use the updated attachment list.
- Unsupported PDF connections show a direct Choose PDF connection action before sending. The picker explains API formats and disables Chat Completions choices while the draft or included history contains a PDF. It does not claim a particular model supports PDFs.
- Selection sends nothing and never silently changes an endpoint, key, or API format. Removing the last draft PDF clears the connection warning unless the conversation already includes a PDF.

This source is newer than build 14. Do not tell the owner it is already installed or assign a new beta before signed-build verification and relevant native checks.

## Native regression lane

`scenario=pdf` uses `scripts/seed-ios-pdf.py` and `e2e/ios-pdf.yaml`. The seed refuses non-CI/non-CoreSimulator targets, missing databases, nonempty app data and existing attachment blobs. It creates owned synthetic PDF bytes and `.invalid` custom endpoints, with no key. No live request or private document is required.

The baseline flow at `02ebef7` uses original native/JS source `2517a7d`, refresh false. It tests a rejected PDF send, one Remove tap with the keyboard open, exact draft retention and cold restart. Run `42561665289` was cancelled because its initial custom-destination fixture omitted `provider=custom`; it is not product evidence. Corrected baseline run `42561735968` reproduces the keyboard-open removal failure; the native evidence is detailed below.

The corrected regression at `40ebfe7` additionally checks warning dismissal, unavailable Chat Completions selection, explicit Responses selection, exact PDF/text preservation, cold-restored connection choice, zero accepted messages, and native SQLite blob/reference equality. The removed PDF must leave no orphaned stored blob. Single-tap checks disable driver retry. A successful fixture cannot establish live PDF understanding, physical touch behavior, VoiceOver or App Review approval.

Local typecheck and all 75 existing tests pass for the source fix. Format, credential, Bash, Python and YAML checks pass. The corrected seed passes the actual app parser and refuses repeated/non-CI seeding. Fresh native workflow `42561881524` passed for `48466d9`; its later automatic UI workflow skipped stale source. The PDF regression passed on refreshed `3431646`; grouped-picker lanes and the next signed candidate have separate status below. Build 14 remains the delivered beta.

## CI evidence review — 9 November 2026

Artifacts are retained locally under `artifacts/smoke-reliability/pdf-removal/`, with separate `baseline`, `fixed`, `gallery`, `attachments`, `native` and `matrix` directories. These are disposable GitHub CI simulator runs, not physical-device tests or signed beta delivery. No provider request or credential was needed.

### Baseline: FAIL (expected regression reproduced)

[Run 42561735968](https://github.com/NihalKA/nylo/actions/runs/42561735968) completed with a UI failure. Native run `42543975993` and original JS are both `2517a7d82f93f2e565d0adf6a7e1d4901026c152`; refresh is false, fixtures are `02ebef7d4ef136c2dd0016fed9f4d65e036a7fdd`. The device was iPhone 17 Pro Max / iOS 26.2. Original JS bundle SHA-256: `510e7297aa3e34d2f7ba72010694e06211fddab57c401869b60553b6112471fe`.

I inspected both actual PNGs, `commands.json`, the failure accessibility hierarchy, `source.txt`, fixture hashes and JUnit. `pdf-01-blocked-with-keyboard.png` visibly shows the synthetic PDF, rejection error, exact draft `Explain this test policy please`, and open keyboard. Command sequence 11 taps `Remove QA policy.pdf` once with `retryIfNoChange=false`. Sequence 12 fails the following `notVisible` assertion after about 17 seconds. The failure PNG shows the keyboard dismissed but the PDF, Remove button and obsolete error remain. AX still reports an enabled `Remove QA policy.pdf` at `[30,732][190,780]`. This is product regression evidence, rather than the invalid-provider fixture failure from cancelled run `42561665289`. Later restoration/storage assertions were not reached.

Baseline fixture SHA-256: flow `cac025b7c8391ad47dd31f691ddebb26be2f0d57bb4ce18cd5e0b3292d25552d`; runner `fdb2a4b4982ba0cf6d04de54c35def4ed7c899a179fa02d4d77d48bd1bb19aed`; PDF seed `d0ff01a3285e9886c6b399dc4ad4d880144b90f1296e81d6d51cbe9f8b859163`.

### Fixed PDF: PASS (3431646, before grouped picker)

Exactly one refreshed run was dispatched: [42562916170](https://github.com/NihalKA/nylo/actions/runs/42562916170), native run `42543975993`, refresh true, JS/fixture source `3431646629926781575c2396edecae5ef454bb30` (docs-only after fixture `40ebfe7`; app fix `48466d95d44cc8321f5d1e668ab97c973a47a932`). Native dependencies/config/plugins/assets match the old runtime. The runner also enforces that compatibility before embedding JS. The run completed successfully. All 44 recorded Maestro commands passed. I inspected all six actual PNGs (including full-resolution removal and picker guidance), command trace, JUnit, provenance/hashes and `pdf-storage-check.txt`. The blocked screenshot has the keyboard open, actionable Choose PDF connection and PDF attached. One Remove tap has retries disabled; the next screenshot retains the open keyboard and exact text while the PDF and obsolete warning/action disappear. Cold launch retains that exact text and no PDF. The picker screenshot shows protocol guidance; the trace asserts the Chat Completions row has `enabled=false`. Explicit Responses selection and cold restoration preserve the PDF/text/connection without sending. Post-flow native SQLite verifies exact drafts, no accepted messages, and `stored == refs == {'pdf-owned-route'}`: no removed-PDF orphan and no lost retained PDF.

Refreshed JS bundle SHA-256: `d9293b2a46ce65944520c5655b14bfb54984fb441500cc7bd022c7732cd3f33f`. Fixture SHA-256: flow `3ccadcbc696c7429e4ce3d72de38379c7e678f9e2a708f61f4c89c0611bd46c5`; runner `c529d9ef29a87c0b241a2182a3f59065fecdceee395ce4847f39c16e7d9ae111`; PDF seed `f219bdb9425b163afa62c7e665f792d80318a8558bc192eddcda7467057df5ef`. These results validate source `3431646`, not the later grouped picker `289fa04`. The synthetic PDF tests local MIME/encoding/attachment behavior only, not live PDF understanding.


### Gallery: FAIL (test selector collision); attachments: PASS (289fa04)

Root subsequently supplied `289fa04ae7ef07ba4b4824a0d34c52aaf497cf38` (grouped provider headings, compact model rows/search, original row accessibility labels and PDF guards preserved). After the PDF pass was inspected, exactly one gallery run [42563933430](https://github.com/NihalKA/nylo/actions/runs/42563933430) and one attachments run [42563942619](https://github.com/NihalKA/nylo/actions/runs/42563942619) were dispatched against native `42543975993`, refresh true. Both run API records confirm checkout `289fa04`. An attempted raw-SHA workflow dispatch returned HTTP 422 without creating any run; successful dispatches used `main` after checking its ref. No valid run was cancelled/replaced. No duplicate PDF lane was dispatched. Grouped-picker PDF-disabled native behavior remains outside the successful pre-grouping PDF run's provenance.


### Native build: PASS (48466d9); automatic matrix: NOT RUN (stale)

[Native run 42561881524](https://github.com/NihalKA/nylo/actions/runs/42561881524) completed successfully for `48466d95d44cc8321f5d1e668ab97c973a47a932`. The retained job log reports the compiled privacy audit parsed 11 manifests with camera purpose and no microphone/tracking declaration; this does not certify the App Privacy label. Its actual `ios-chats.png` was inspected and shows the empty Chats launch screen. This is build/launch evidence, not the PDF interaction regression or grouped picker.

[Automatic UI run 42564121710](https://github.com/NihalKA/nylo/actions/runs/42564121710) reports workflow success but its retained `decision.json` explicitly says `skipped_stale_auto`, `uiRequested=false`, `uiResult=not_run`: native source `48466d95d44cc8321f5d1e668ab97c973a47a932` differed from fixture checkout `2fc62627b6b2370fc6a4418fc47d87ad0b34bd46` app/build inputs. No three-profile UI matrix ran, so this is not three PASS results. The run was preserved; no duplicate matrix was dispatched.

Root-owned [native run 42563645051](https://github.com/NihalKA/nylo/actions/runs/42563645051) targets grouping source `289fa04ae7ef07ba4b4824a0d34c52aaf497cf38` and remains pending/in progress at this intermediate review. No signing, Apple action, beta assignment, production approval or App Store submission was performed by this validator.


### Gallery failure diagnosis — 42563933430

The run failed after 27 recorded commands at the assertion that the model picker should close. I inspected the actual picker/search/failure PNGs, failure AX, command trace, Maestro tap log, provenance and JUnit. The new picker visibly shows each provider heading once, model names as the primary rows, a compact search field, and no repeated provider name on each row. Search for `synthetic-secondary` filters out alternate; exact-row selection succeeds and the conversation model label updates. Clearing search restores both provider groups.

The next fixture selector `Offline QA alternate.*` now matches the new noninteractive provider heading as well as the intended model row. The Maestro log at `04:56:12.240` explicitly records tapping `accessibilityText=Offline QA alternate`, bounds `[20,728][420,749]` (21-point heading). The failure AX separately shows the enabled unchecked radio row `Offline QA alternate. synthetic-alternate` at `[20,753][420,803]` (50 points). The failure PNG leaves the picker open with `synthetic-secondary` still checked. This is a grounded fixture selector collision, not evidence that a tap on the alternate model row fails. Minimal test-only proposal: replace that broad selector with `Offline QA alternate[.] synthetic-alternate`; retain the following picker-closed and selected-connection assertions. No fixture/app edit, retry, assertion weakening or replacement run was made within this task.

The failure occurs before Copy response, clipboard comparison, file lifecycle and SQL verification. No original full 293-byte clipboard read or gallery storage PASS exists for this run. Earlier green gallery runs must not substitute for it. Grouped PDF-disabled native behavior was not exercised in this non-PDF gallery fixture.

Gallery native source `2517a7d82f93f2e565d0adf6a7e1d4901026c152`, native run `42543975993`; JS/fixture source `289fa04ae7ef07ba4b4824a0d34c52aaf497cf38`, refresh true; iPhone 17 Pro Max / iOS 26.2. Bundle SHA-256 `2a897670a6c1bc4e4f3fb7f66e46e69813fe6c2c9a3cf081faba7c5a8e42ab0e`; flow `c14937bfb0b754bf21b3177f597d3d515728ec739d86d5be0c84061d4a36b1f4`; runner `c529d9ef29a87c0b241a2182a3f59065fecdceee395ce4847f39c16e7d9ae111`; gallery seed `cbe38e18844ce5978bf39b0848d9b9ce0b954b4e79251167f5abd14d41c71203`.


### Attachments: PASS — completed artifact review

[Attachments run 42563942619](https://github.com/NihalKA/nylo/actions/runs/42563942619) completed successfully on `289fa04ae7ef07ba4b4824a0d34c52aaf497cf38`, refreshed JS on native `42543975993` / `2517a7d82f93f2e565d0adf6a7e1d4901026c152`. Its retained CI log reports `1/1 Flow Passed` at `05:03:08 UTC` and `PASS: owned picker metadata outcome and SQLite blob-reference cleanup` at `05:03:27 UTC`. The 17,402,518-byte artifact download completed after the initial bounded handoff; its completion notification prompted this narrow follow-up review. I inspected all ten actual screenshot checkpoints, full-resolution picker and cold-restored photo PNGs, the retained output JPEG, command trace, provenance, hashes, JUnit, execution status, metadata diagnostic and SQL check. Of 88 recorded commands, 87 completed and the conditional camera `Allow` subflow alone was skipped because the alert was absent; no required assertion failed.

The actual Photos grid shows the owned green tile at index 0, and imported/cold-restored previews match it. The flow proves first import/restoration/removal, Photos and Files cancellation, visible simulator camera fallback, continued exact text editing, second import clearing the stale camera error, and cold-restored second photo plus exact draft `QA photo draft stays safe after camera fallback`. Native SQL confirms all blob IDs equal all-chat references, including no first-import orphan; exactly one new Photo.jpg remains in the target draft. The retained JPEG is 799 bytes and 32×32; canonical base64/size/SOI/EOI checks passed. Original Artist/GPS and the synthetic marker are absent; only explicitly allowlisted encoder EXIF remains. This is a simulator pipeline outcome; Photos may strip EXIF before Nylo, and this does not prove physical camera/HEIC, universal files, temporary-file deletion or native resource lifetime.

Attachments JS bundle SHA-256 `5962ce527cd2764ffc5429903cd5505f17d56ce661959ff205b30e4672ebc560`; flow `6b11febcd8570ccf949d9a5c8a93897c1637e6ef7de2ea01974b12a22238fc65`; runner `c529d9ef29a87c0b241a2182a3f59065fecdceee395ce4847f39c16e7d9ae111`; metadata fixture `df8d469c178f4e8324eca9d4cb708d9680960328777d126b9fdefd8b10261fba`; SQL checker `f6004043274b4301ea838253693f41552477393d6396aa832dd7f1ba8e098067`. Source JPEG SHA-256 `3fa7b5527fa94f8707d4364f32495b07539db0102b14506af079603c5c28c108`; retained output `6bbd8cdbdfbd37bac5308231b4d57798368e350a6593b525ec2a0ef8d6a66ac4`.

At the bounded handoff, root-owned native `42563645051` for `289fa04` is still `in_progress`, conclusion empty. No automatic matrix for that native source has been observed. The older native `48466d9` PASS and its stale-auto NOT RUN remain separate evidence. The grouped picker PDF-disabled state and full 293-byte gallery clipboard/SQL verification remain open, for the reasons above. This report is left uncommitted; app/src/native config and fixtures were not changed by this validator. Build 14 remains the delivered beta; no new beta delivery or App Store approval is claimed.
