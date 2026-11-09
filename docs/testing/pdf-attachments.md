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

The baseline flow at `02ebef7` uses original native/JS source `2517a7d`, refresh false. It tests a rejected PDF send, one Remove tap with the keyboard open, exact draft retention and cold restart. Run `42561665289` was cancelled because its initial custom-destination fixture omitted `provider=custom`; it is not product evidence. Corrected baseline run `42561735968` must be inspected before claiming reproduction.

The corrected regression at `40ebfe7` additionally checks warning dismissal, unavailable Chat Completions selection, explicit Responses selection, exact PDF/text preservation, cold-restored connection choice, zero accepted messages, and native SQLite blob/reference equality. The removed PDF must leave no orphaned stored blob. Single-tap checks disable driver retry. A successful fixture cannot establish live PDF understanding, physical touch behavior, VoiceOver or App Review approval.

Local typecheck and all 75 existing tests pass for the source fix. Format, credential, Bash, Python and YAML checks pass. The corrected seed passes the actual app parser and refuses repeated/non-CI seeding. Fresh native workflow `42561881524` is building `48466d9`. Native regression results and the next signed candidate are pending; build 14 remains the delivered beta.
