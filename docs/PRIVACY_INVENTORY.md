# Release privacy inventory

Checked against source 1079f85 on 8 November 2026. This inventory is preparation for the final App Store declaration, not a submitted label.

| Data | Device storage | Off-device transfer | Purpose / control |
| --- | --- | --- | --- |
| Chats and drafts | Local application database | Selected conversation context to the selected AI provider on send | Response generation; provider-sharing approval required. Drafting alone sends nothing. |
| Agent instructions and approved facts | Local database, isolated by agent | Included in that agent's provider requests | Agent personalization; editable/deletable memory. Earlier full transcripts are not automatically included. |
| Provider key | Native SecureStore envelope bound to protocol/destination | Authorization to selected HTTPS provider, including model discovery | Provider authentication/billing. Staged retirement journal supports interrupted save cleanup. Excluded from backup exports. |
| Provider/model settings | Local database | Destination/model used for provider calls | User-configured service access. |
| Network metadata | No app analytics inventory | Provider receives ordinary network information, including IP | Transport and provider operations; provider retention/policies vary. |
| Backup export | Temporary local JSON, cleaned after sharing | Only through user-selected OS share destination | User-controlled plaintext backup; excludes keys, credential references and sharing grants. |
| Support correspondence | Outside app | Email provider and publisher when user sends email | Optional user-initiated support, no automated chat upload. |

No Nylo backend, login, ad SDK, analytics SDK or automatic synchronization is implemented. The app has no contacts, photo, microphone, location or tracking feature. Provider requests are text-only. Provider-side retention is not established by setting Responses `store: false`.

Apple's current guidance defines collection by off-device accessibility beyond servicing a request in real time and requires accounting for third-party partners. Core-functionality data does not become exempt merely because sharing requires permission. Source: https://developer.apple.com/app-store/app-privacy-details/ (checked 8 November 2026).

Before submitting final declarations:

- Reconcile all bundled SDK privacy manifests and required-reason API declarations against the exact release archive.
- Check provider retention and account linkage for the supported services; do not assert "Data Not Collected" solely because Nylo has no server. The BYOK/custom-provider arrangement requires accurate treatment rather than assuming zero collection or inventing vendor practices.
- Complete accurate purpose/linkage/tracking answers in App Store Connect. Provider-authenticated text content and identifiers require explicit consideration; no tracking implementation is present.
- Update public privacy copy for remembered cross-chat approval and its reset control. Explain that resetting approval stops future transmission until renewed and cannot erase provider-held information.
- Confirm exact release network behavior and the final age/content safeguards before submission.
