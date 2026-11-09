# Delivery status

Updated9November2026IST. Target: iOS first; Android publication deferred. Owner requests agent continuity, model libraries, file/photo/camera attachments, a tested beta and95/100 independent quality. The score must follow evidence; it is not achieved yet.

## Delivered expanded feedback beta13

App source `4d3687d3275d8b74bbe9d13be8e17ffb2c8b27f3`. Newer source2517a7d contains the two tested refinements listed below. Typecheck,75behavioral tests, formatting and credential audit122tracked files pass.

- Native [42532333345](https://github.com/NihalKA/nylo/actions/runs/42532333345): passed. Compiled privacy audit verifies SDWebImage resource, camera purpose, no microphone/tracking, version1.0.0, iPhone family1. Temporary image tracing removed. Source-built SDK guards retain foreground image tasks and reject unavailable camera hardware before UIKit assignment.
- Matrix [42533495588](https://github.com/NihalKA/nylo/actions/runs/42533495588): compact, large and maximum text pass, including draft/memory cold restoration and multiline composition.
- Attachments [42533835643](https://github.com/NihalKA/nylo/actions/runs/42533835643):55completed/1optional skip. Actual owned-photo preview, nonempty draft/image cold restoration, removal, Photos/Files cancellation and handled simulator-camera unavailability pass. No earlier camera SIGABRT remains in retained logs. Stronger42537460454 passes66commands/1optional skip, including exact post-camera typing, one keyboard dismissal, attachment-menu reopen/cancel and explicit final composer enabled. The earlier caret-placement fixture assumption is corrected.
- Gallery [42535017786](https://github.com/NihalKA/nylo/actions/runs/42535017786):181/181, exact293-byte clipboard equality and native SQLite/blob checks pass. Responses/recovery examples are explicitly synthetic, not live generation/recovery evidence.
- These UI runs use native/JS/flows4d3687d with refresh false, iOS26.2. Actual65flow PNGs, AX, commands, hashes and provenance were inspected. Evidence: ignored `artifacts/smoke-reliability/clean-camera`.
- Signed [42532356732](https://github.com/NihalKA/nylo/actions/runs/42532356732):1.0.0(13), source4d3687d. Actual exported-IPA privacy audit passes11manifests/requiredSDK/camera/noMic/nonexemptfalse/family1. Apple VALID, ID `e6568582-6b46-4061-ab81-df09b8a6fca4`. Assigned to internal Nylo Device QA: POST204 and subsequent group GET verify this exact VALID build. English test notes saved with validation gaps; build10 is the previous design.

## Scope and acceptance

See EXPANDED_BETA.md and STATE_MACHINES.md for model libraries (one active model per send), same-agent optional recent context plus approved memories, bounded attachments, transactional attachment blobs, prospective send validation, typed picker/catalog transitions and27inventoried state machines.

Latest independent review:86/100 provisional for4d3687d, reviews/020-clean-expanded-beta13.md. No new high/critical product defect; photo blocker resolved for the tested simulator path. It supports build13 for internal feedback/device validation. The95target and accessibility floor12/15 (currently11) are not met. Owner design acceptance, physical iPhone, VoiceOver, live provider/image/PDF/recall/interruption and real camera/denial/EXIF checks remain unconfirmed. A feedback beta does not establish production acceptance.

## Physical and live evidence

T3 Beta0.1.7 exposes simulators only. Wired iPad trust/pairing/developer mode are complete; do not request Trust again. Local simulator screenshot capture failed twice after refresh; interaction stopped. CI uses actual Apple Simulator runtimes, not a browser mockup. No physical/VoiceOver pass is inferred.

Settings → Live device check provides explicit per-action consent, one request capped128output tokens, approved test-memory recall, restart verification and scoped cleanup. Results remain on device; no owner outcomes received. Ordinary chats retain their normal output limit and can incur provider charges.

Four earlier restricted text/tool/recall provider requests were used under their own authorization. **Zero expanded live requests**: later private cards expired/cancelled without a key. Do not reuse or extend the old key scope. App Review requires separate restricted, expiring access and budget.

## App Store preparation

App6832224555, seller Nihal K A; signing/account configured. Draft version1.0.0 remains PREPARE_FOR_SUBMISSION, no store build association/submission. India and US only; availableInNewTerritories false, no preorders, both free prices verified. Public privacy/support site reflects attachments and quoted-file context. Final screenshot upload, truthful age/privacy declarations, monitored support practice and restricted functional review access remain incomplete. See app-store-readiness.md and RELEASE.md.

No production approval or release is claimed. Do not treat Apple VALID, a passing simulator matrix or a reviewer score as physical/live/owner acceptance.

## Tested next source2517a7d (signing pending)

Attachment cards use concise visible Remove text while retaining the full filename in the accessibility label. Starting a new import clears the previous local error. Typecheck and75tests pass.

- Fresh native42543975993 and automatic matrix42545994892 pass all3profiles, native/JS/flows2517, refresh false.
- Fresh gallery42547833210 passes181/181, exact293-byte original/expected clipboard equality and native SQL/blob checks. Native/JS2517, fixtures51527dd, refresh false. Earlier refreshed-gallery empty clipboard read remains unexplained; no Copy handler change was made or credited.
- Fresh attachments42547836294 passes87completed/1optional skip, all lifecycle/recovery checks and old camera error absent after the second successful import before restart. SQL references match with no removed-import orphan. Owned source Artist/GPS are absent in the stored799-byte JPEG; only explicitly allowed encoder fields remain. Native/JS2517, fixtures51527dd, refresh false. This is owned JPEG pipeline evidence, not physical camera/HEIC/universal metadata proof.

Evidence: ignored artifacts/smoke-reliability/fresh-polish-final. Build13above remains delivered; no newer TestFlight assignment yet. The86point review applies to13, not automatically to this source.
