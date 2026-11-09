# Release privacy inventory

Current client behavior is reconciled against app289fa04 and the signed1.0.0(15) compiled-manifest audit. This remains preparation for the final App Store declaration, not a submitted or authenticated privacy label. Nylo has no app backend; chats/files/memory are local until a user chooses a provider request or export. The owner confirms no Nylo/NyloHQ prompt retention, but upstream model-provider practices were not independently verified from the client. Do not request a nonexistent app-backend repository or infer zero upstream collection from client architecture. The intended audience is adults18+, owner-confirmed on9November2026; age questionnaire completion is separate.

| Data | Device storage | Off-device transfer | Purpose / control |
| --- | --- | --- | --- |
| Chats and drafts | Local application database | Selected conversation context to the selected AI provider on send | Response generation; provider-sharing approval required. Drafting alone sends nothing. |
| Agent instructions and approved facts | Local database, isolated by agent | Included in that agent's provider requests | Agent personalization; editable/deletable memory. Earlier full transcripts are not automatically included. |
| Provider key | Native SecureStore envelope bound to protocol/destination | Authorization to selected HTTPS provider, including model discovery | Provider authentication/billing. Staged retirement journal supports interrupted save cleanup. Excluded from backup exports. |
| Provider/model settings | Local database | Destination/model used for provider calls | User-configured service access. |
| Selected photos/files/camera image | Native SQLite attachment blobs with transactional metadata; self-contained readable backups | Content retained in the current conversation is sent to the selected provider only after explicit attachment-send approval | Optional OS selection/camera; no upload on pick. JPEG re-encoding removes original EXIF, not identifying pixels or document content. Delete draft file/chat or all local data to remove app references; exported/provider copies are separate. |
| Recent agent-chat excerpts | Existing same-agent local conversations; selection computed on send | Up to8 recent same-agent text excerpts,12kcharacters, only when explicitly enabled | Review/off controls. Imported backups cannot enable it. Deleting a saved fact does not erase source-chat mentions. |
| Response report | Editable preview; optional selected excerpt | User-chosen email to support, sent only by the user in their mail app | No automatic delivery, other chats/files/keys excluded; owner confirmed admin@colorforfun.app is actively monitored for support and AI-response reports on 9 November 2026. |
| Network metadata | No app analytics inventory | Provider receives ordinary network information, including IP | Transport and provider operations; provider retention/policies vary. |
| Backup export | Temporary local JSON, cleaned after sharing | Only through user-selected OS share destination | User-controlled plaintext backup; excludes keys, credential references and sharing grants. |
| Live device check | Synthetic test chats, approved test fact and local restart/event bookkeeping | Synthetic text and approved fact sent only after each explicit request confirmation | One request capped at 128 output tokens per action, tools disabled. No automatic report. Bookkeeping is excluded from backup exports/imports; synthetic chats/facts remain in user-requested backups until removed. Scoped cleanup preserves personal data. |
| Support correspondence | Outside app | Email provider and publisher when user sends email | Optional user-initiated support, no automated chat upload. |

No Nylo backend, login, ad SDK, analytics SDK or automatic synchronization is implemented. The app has no contacts, microphone, location or tracking feature. Optional selected photos and camera images are supported in the expanded candidate; provider requests may include those images, PDFs and text files. Provider-side retention is not established by setting Responses `store: false`.

Apple's current guidance defines collection by off-device accessibility beyond servicing a request in real time and requires accounting for third-party partners. Core-functionality data does not become exempt merely because sharing requires permission. Source: https://developer.apple.com/app-store/app-privacy-details/ (checked 8 November 2026).

Before submitting final declarations:

- Reconcile all bundled SDK privacy manifests and required-reason API declarations against the exact release archive.
- Check provider retention and account linkage for the supported services; do not assert "Data Not Collected" solely because Nylo has no server. The BYOK/custom-provider arrangement requires accurate treatment rather than assuming zero collection or inventing vendor practices.
- Complete accurate purpose/linkage/tracking answers in App Store Connect. Provider-authenticated text content and identifiers require explicit consideration; no tracking implementation is present.
- Update public privacy copy for remembered cross-chat approval and its reset control. Explain that resetting approval stops future transmission until renewed and cannot erase provider-held information.
- Confirm exact release network behavior and the final age/content safeguards before submission.
