# App Store preparation for the expanded Nylo beta

Prepared 8 November 2026. This is a release worksheet, not an App Store submission or an assertion that the expanded features are implemented. The user authorized model libraries, file/photo/camera attachments, stronger agent behavior, a new tested beta and parallel store preparation. The requested quality goal is 95/100; an independent reviewer must determine the result from evidence.

Current follow-up (9 November 2026 IST): source, signed build 12 and the draft App Store version are 1.0.0; the version remains PREPARE_FOR_SUBMISSION with no store build associated. Apple marks build 12 VALID. Its exact exported-IPA audit verifies the source-built SDWebImage privacy resource, 11 parsed manifests, camera purpose, no microphone purpose and no tracking declarations. This resolves the earlier packaging finding; it does not certify App Privacy answers or App Review approval. Build 12 uses e7ec9e0; the later attachment-sheet layout still requires a new signed candidate after current native tests.

## Verified account state

The current App Store Connect record is [Nylo](https://appstoreconnect.apple.com/apps/6832224555), bundle `com.nylohq.nylo`, seller Nihal K A. API results are retained in ignored `artifacts/app-store-preparation/`.

| Item                 | Observed state                                                                                                                                                                                                                       | Remaining work                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Store version        | 1.0.0, PREPARE_FOR_SUBMISSION, release after approval                                                                                                                                                                                  | Align final source marketing version and select the exact tested signed build                          |
| Selected store build | Relationship is null                                                                                                                                                                                                                 | Do not select older build 10 as proof of expanded features                                             |
| English listing      | Name, subtitle, description, keywords, promotion, support/privacy URLs saved                                                                                                                                                         | Apply updated feature copy only after verified implementation                                          |
| Category             | Productivity                                                                                                                                                                                                                         | Retain unless actual final scope changes                                                               |
| Screenshots          | Zero screenshot sets                                                                                                                                                                                                                 | Capture/upload the expanded candidate's real native interface                                          |
| Age rating           | Declaration exists; content/feature answers and resulting ratings are null                                                                                                                                                           | Complete a truthful final questionnaire; do not infer a low rating from no bundled objectionable media |
| Pricing/availability | Owner chose India and US. API writes succeeded; read-back verifies exactly IND/USA available among 175 territories, automatic expansion false, preorders false, no release dates. USA manual and IND automatic price points both 0.0 | Keep this two-country scope; account configuration does not constitute publication                     |
| Encryption           | No declaration document records; current build 10 has nonexempt encryption false                                                                                                                                                     | Reconcile final app and SDK crypto; absence of a document is not itself a failure when exempt          |
| App Privacy label    | Public API path used did not expose this state                                                                                                                                                                                       | Verify final declarations in the authenticated console; privacy URL alone is not a completed label     |

Build 0.1.0 (10) is the previous feature set, Apple VALID and assigned to internal Nylo Device QA. Independent review 016 scores it 85/100 provisional. It does not verify new attachments, multiple-model setup or expanded agent context. No production submission has occurred.

## Drafts prepared

These are ignored local artifacts, not saved App Store mutations:

- `artifacts/app-store-preparation/metadata-en-US.draft.json`: proposed name, subtitle, promotion, keywords, description and URLs. Character limits checked locally.
- `artifacts/app-store-preparation/description-en-US.draft.txt`: readable description, conditional on the final supported paths.
- `artifacts/app-store-preparation/review-notes.draft.md`: review walkthrough and placeholders for separately authorized private access. Contains no credential.
- `artifacts/app-store-preparation/attachment-policy-delta.draft.md`: public policy/support changes and privacy-label worksheet.
- `artifacts/app-store-preparation/screenshot-plan.draft.md`: real-native capture plan with harmless owned examples.

The proposed model wording means several saved selectable models, including all returned catalog models within the app's bounds, with **one active model per send**. It does not promise simultaneous answers, universal catalog completeness or that every listed model supports chat, images, PDFs or tools.

The implementation owner's intended attachment scope is JPEG/PNG images, optional camera capture, PDFs up to 2 MB, and readable TXT/Markdown/CSV/JSON up to 100,000 characters; at most four attachments and 4 MB per message. Images are recompressed to JPEG without original EXIF. Responses/Messages carry images and PDFs; Chat Completions carries images/text and rejects PDFs locally. These are planned boundaries to verify, not completed test results.

## App Review implementation checks

Apple's current guidelines cover AI content creation in guideline 1.2. Filtering, reporting, contact and abuse controls require an intentional assessment; private local chat is not a blanket exemption. The app has no public feed or interpersonal user service, so do not invent a user-blocking function or misdescribe the architecture. Guideline 5.1.2 requires explicit permission for third-party AI sharing. Review must have functional access, and metadata must match shipped behavior. BYOK acceptance remains an actual review decision, not a preapproved business model. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

Concrete work for the implementation/release owner:

1. **Safety/reporting:** add a reachable response-report action with an exact report preview and explicit confirmation. Send only the content the user chooses to a real monitored support destination; omit keys and other chats/attachments by default. Provide local removal of unwanted output and a published support contact. A placeholder endpoint, local-only flag or unmonitored email address is not a complete intake. An OS email handoff must say that nothing is delivered unless the user sends it; its final adequacy remains review-dependent. Do not claim prompt-only safeguards guarantee moderation. Test relevant safe/refusal behavior without storing harmful fixtures in public evidence.
2. **Permission and sharing:** selecting a file/photo must not upload it. The send confirmation should identify the chosen provider and HTTPS destination, attachment names/content scope, relevant history, agent context and charges. Check retry and provider/model changes. Never let restored or remembered text consent silently authorize newly introduced attachment or cross-chat context scope.
3. **Agent scope:** approved memories and optional recent-chat context are different sources. Intended recent context is a bounded text excerpt (up to 12,000 characters) from the same agent only, with review/off controls. Delete source conversations from future retrieval. Explain that deleting a memory does not erase text from prior chats, exports or provider-held copies. Do not claim complete or unlimited recall.
4. **Camera/photos/files:** camera access is optional and requested only when chosen, with a precise usage description. Test denial/cancel/limited selection and return to text chat. Prefer system pickers without asking for broad photo-library access. Do not request microphone access for still images. Verify image recompression removes original EXIF; visible picture details and embedded PDF/text metadata can still identify people. Check local copies, restart, deletion and backups.
5. **Provider compatibility:** reject unsupported PDFs before network use, preserve drafts on errors, and explain model-level limitations rather than asserting capability from catalog presence. Test malformed/oversized file handling, image/PDF/text wire bodies, selected-model routing and bounded context. Rendering a synthetic answer does not validate image/PDF understanding.
6. **BYOK and payments:** retain an honest key setup, separate API-charge notice, no embedded shared key, no Nylo credit sales or paid unlocks, and no external purchase/billing links added by this feature work. Do not call a consumer chat subscription an API entitlement. List external AI services and the BYOK flow in review notes. Investigate the actual Apple objection if raised instead of claiming a categorical exemption.
7. **Evidence and minimum functionality:** capture the original native UI and demonstrate agent purpose/approved memory, optional scoped context, durable drafts, model selection and attachment workflow. Do not market Nylo as an official ChatGPT/Grok app or imply browsing, app control, audio/video analysis or background work. Resolve maximum-text findings from review 016 and obtain current compact/large/accessibility renders, a fresh native build, a signed expanded candidate and an independent review.

## Privacy and age declarations

The current deployed policy and source inventory cover local attachment copies, readable backups, provider transfers and retained history, original-file preservation, no upload on pick and optional camera access. They explain that files themselves are excluded from recent-chat excerpts, while conversation text quoting or discussing files may carry over. Reconcile these disclosures with the final signed candidate and live provider behavior.

Assess Photos or Videos and Other User Content for images/documents/prompts, optional Customer Support, provider authentication/account linkage and network metadata. No Nylo backend does not establish Data Not Collected; no Nylo login does not establish Not Linked. Third-party retention and linkage must be checked. [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)

AI-generated sensitive-content frequency must inform the age questionnaire. Do not classify AI-only conversations as interpersonal chat without reading the question definitions. Avoid Kids-category or child-safety guarantees unsupported by the implementation. Recheck the live questionnaire at submission: new shared-location and dating/romantic-virtual-companion descriptors arrive 16 November 2026, with completion required by 12 January 2027. This notice does not establish that Nylo has those features. [Apple age-rating notice](https://developer.apple.com/news/?id=yxkh08us), [rating definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions)

Repeat required-reason/privacy-manifest inspection on the exact signed expanded archive, including new image/camera dependencies. The current operating-system-only/exempt encryption declaration must still be accurate for final dependencies. [Encryption documentation requirements](https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption)

## Final screenshots and access

Use real native captures from the final feature set, with opaque PNGs and harmless examples. Prepare large and medium Dynamic Island portrait captures (1320×2868 and 1206×2622) and verify the accepted/required classes in the console before upload; currently indexed versions of Apple's screenshot page differ in required-display wording. No iPad screenshot set is implied while the signed app remains iPhone-only. [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

App Review must be able to exercise live core functionality without purchasing credits. The parent must request a **separate restricted, expiring review credential and explicit request/spend allowance** through private secret input when the review-ready candidate exists. Never reuse the earlier smoke-only authorization, put a key in source/CI/screenshots, or ship it in the binary. Verify text, image/PDF and memory-tool access for every model claimed in the review path. Keep notes private and honest about foreground interruption. [Complete-review guidance](https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review)

## Actual owner dependencies

Account creation and signing are already configured; do not ask for them again. Only escalate a concrete missing item when it is ready to act on:

- Any new account-holder agreement, identity/trader verification or legally required attestation shown by Apple; this read-only check did not inspect or accept new agreements.
- Actual launch-country/legal choices and unresolved declarations, after presenting the prepared accurate answers and implementation evidence. Do not invent an organization, address, provider policy or content frequency.
- The separately authorized App Review credential and bounded provider budget through private input. Provider usage can cost money; the earlier six-call smoke allowance is not a review allowance.
- A responsible monitored reporting/support intake and retention practice if the existing support owner has not established one.
- Genuine owner design judgment and physical iPhone/live/VoiceOver outcomes. These are product-evidence gates, not legal attestations and not replaceable by a higher reviewer score.

The original preparation was read-only. Subsequent authorized account changes aligned the draft version to 1.0.0, set the free price and configured India/US availability only. No agreement was accepted, age/privacy declaration attested, store build selected, purchase made or review submitted.
