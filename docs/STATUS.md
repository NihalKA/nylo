# Delivery status

Updated 9 November 2026. iOS first; Android publication is deferred. The owner authorizes end-to-end development, testing, screenshots, TestFlight and App Store submission/release. Launch scope is **India and US only**, free, with automatic territory expansion and preorders disabled.

## Delivered beta and current candidate

**Delivered: 1.0.0 (14)**, app source `2517a7d`, Apple build `93f7eb90-c986-49ee-b103-8077d07832b4`. Exact internal Nylo Device QA assignment and `IN_BETA_TESTING` were verified. It remains the available beta until candidate 15 clears its remaining validation.

**Candidate: 1.0.0 (15)**, app source `289fa04ae7ef07ba4b4824a0d34c52aaf497cf38`, signed workflow [42563798870](https://github.com/NihalKA/nylo/actions/runs/42563798870). Apple reports build `6f7be5da-a57a-4267-a18d-015c6e57b16b` VALID. Its exported-IPA audit verifies version/build/bundle, iPhone family 1, eleven manifests, required SDWebImage manifest, camera purpose, no microphone/tracking declaration and exempt encryption. This establishes processing and compiled declarations, not App Review approval. Candidate 15 is not yet assigned or associated with the store version.

Candidate 15 includes keyboard-open single-tap attachment removal, immediate durable removal and stale-error clearing, actionable PDF connection selection, and a provider-grouped model picker with compact model-primary rows. Source checks pass typecheck, **76 tests**, formatting, credential audit and Expo Doctor 20/20. Subsequent commits change fixtures/documentation only.

## Current native evidence

- Fresh native [42563645051](https://github.com/NihalKA/nylo/actions/runs/42563645051): PASS for app289. Actual simulator archive, compiled audit and launch inspected.
- Fresh automatic matrix [42566511878](https://github.com/NihalKA/nylo/actions/runs/42566511878): large PASS, 94 commands and 14 screenshots inspected. Compact and maximum text failed before any flow command at a driver-download HTTP 504. Attempt 2 reruns only those failed jobs; results are pending. The passing large job is preserved. The old app484 automatic lane was explicitly stale/skipped, not three passes.
- Grouped PDF [42565373731](https://github.com/NihalKA/nylo/actions/runs/42565373731): PASS, 44/44 commands, six screenshots and SQL inspected. One Remove tap works with the keyboard open, exact text survives restart, the incompatible radio is disabled, an explicit Responses choice preserves the PDF/draft, and the removed PDF leaves no stored orphan.
- Corrected gallery [42565370562](https://github.com/NihalKA/nylo/actions/runs/42565370562): PASS, 181/181, all 17 screenshot checkpoints inspected. Original clipboard exactly equals the full 293-byte response; native SQL/blob checks pass. Model search/selection, provider navigation, role replacement, recent-context review, full final history answer, report preview, test-memory restart/cleanup and personal-draft preservation execute.
- Attachments [42563942619](https://github.com/NihalKA/nylo/actions/runs/42563942619): PASS, 87 commands plus one conditional skip; ten screenshots, hashes and SQL inspected. Photo/draft cold restoration, removal, picker cancellation, camera-unavailable recovery, later error clearing and blob cleanup pass. Owned JPEG original Artist/GPS are absent; only allowlisted encoder fields remain. Photos may strip metadata before Nylo; physical capture, HEIC and universal metadata claims are not established.

PDF/gallery/attachment runs use native2517/run42543975993 with refreshed app289 JS and recorded fixtures; they are not fresh-native or signed-binary identity evidence. The fresh matrix uses native/JS289 with refresh false. Evidence and exact provenance are in [review 021](reviews/021-candidate15-grouped-picker-live-evidence.md) and [PDF report](testing/pdf-attachments.md).

## Live provider evidence and limits

A separately supplied review-only credential was used under an explicit eight-request preflight allowance. The initial gpt-6-luna checks failed; a diagnostic returned HTTP 403. The owner corrected the model to **gpt-5.6-luna**. Catalog GET confirmed that exact ID. The final two generation requests, each capped at 128 output tokens, returned HTTP 200 with real streaming deltas and passed exact assertions for supplied approved memory/recent-chat facts and an owned PDF marker/green PNG color.

Sanitized current-source evidence: `artifacts/review-preflight15/results.json`. These are source-adapter tests, not native UI, memory-tool approval, live isolation, interruption or physical-device proof. **The eight-request budget is exhausted. No further provider calls are authorized by it.** The earlier separate smoke allowance remains unchanged and is not a fallback. Reviewer-key expiry and enforced limits are still unanswered; do not disclose review access to Apple before those facts are established.

## Independent quality and acceptance

Latest independent GPT-6 Astra review: **88/100 provisional** for candidate 15; no new critical/high product defect established. Accessibility 11/15 and native interaction 7/10 are below their 80% floors. The owner's 95 target is not met. Review 021 recommends candidate 15 only for narrow feedback/device validation after missing profile coverage is completed and exact QA assignment is verified. Do not request a friendlier score for an infrastructure retry or infer new points yourself.

Owner acceptance of the updated design, signed-device first use, physical camera/denial/HEIC, VoiceOver, live native consent/tool approval/recall/isolation/interruption and sustained native Task/cache lifetime remain unconfirmed. No reproduced resource leak is claimed. T3 exposes simulators only; wired iPad trust/pairing/developer mode were already completed. Local device capture failed twice and was stopped. CI uses actual Apple Simulator runtimes, not browser mockups.

## Store preparation and remaining account work

App `6832224555`, seller Nihal K A, version 1.0.0 remains **PREPARE_FOR_SUBMISSION**, with no store build associated and no review submitted. The expanded English listing is saved and read-back verified. Five original 1320 × 2868 native screenshots are COMPLETE in English set `586a3e17-ab4c-442d-ab05-055c4e558d46` (`APP_IPHONE_67`). They show the older app2517 picker. Fresh capture [42568114632](https://github.com/NihalKA/nylo/actions/runs/42568114632) uses native289, refresh false, and illustrative gpt-5.6-luna configuration; actual review/export/replacement upload is pending. No provider key or requests occur in the asset lane.

The owner confirmed **admin@colorforfun.app is actively monitored** for support and AI-response reports. Monitoring is resolved; no response-time or retention period was supplied.

The owner confirmed Apple sign-in, but authenticated console control remains unverified: T3 snapshot/navigation and fallback computer-use discovery timed out after the permitted retries, then stopped. The public JWT API works for builds/listing, but the privacy dataUsages endpoint returns 404. App Privacy remains unverified and age answers remain unset. Do not infer declarations from a privacy URL or compiled manifests.

Final account declarations, functional private App Review access/limits, current screenshot replacement and product/device gates remain. `NYLO_RELEASE_READY` stays off. Apple VALID, internal TestFlight, a passing simulator lane and a reviewer score are not App Store submission or approval.
