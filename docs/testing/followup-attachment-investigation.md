# Follow-up attachment investigation

Reported 2026-11-10: attaching a file on the first prompt causes repeated requests
to send the file on later prompts. Scope: both iOS and Android.

Baseline: `86a57a8763bce39b29a8e903af972fc3371385b2`.

## Findings

`src/store.tsx` gathers all previous message attachments on every send and calls
`askPermission("Send attached content?", ...)` whenever any exist. Approval is not
remembered for attachments. This explains repeated **app permission dialogs** on
both native platforms; `src/consent.ts` uses the same native Alert implementation.
The owner confirmed that the repeated request is this permission dialog.

The source does not discard the first message's file on the next turn.
`prepareSend` retains conversation messages; `preflightRequest` carries their
attachments; each provider serializer includes their bytes again. This is needed
because requests do not rely on server-side conversation storage. A provider-side
request for re-upload has not been reproduced or ruled out by these local tests.

## Regression evidence

Three added tests cover Responses, Anthropic Messages, and Chat Completions
compatible protocols across three user turns, retries, and native metadata/blob
restoration. Each asserts original attachment bytes in serialized requests and
checks that history contains one copy of each attachment. PDFs are exercised only
for supported Responses/Messages protocols; images and text cover all three.
All 14 tests in `expanded-features.test.ts` pass. No live provider request was made.
This tests shared iOS/Android logic, not installed native apps or model behavior.

## Fix

Updated from main `7c03642`, whose link-specific policy supersedes the historical
universal implementation gate. Local provider consent now retains approved immutable
attachment IDs per conversation. Approval is recorded in the durable message
acceptance write after all prompts succeed. Follow-ups, retries and local restarts
reuse approval; newly picked files have fresh IDs and require approval. Provider
endpoint/protocol/credential changes and reset sharing permission require approval
again. Backup export/import strips provider consent including attachment approvals.
No provider request or attachment bytes are removed from follow-up history.

Automated tests cover first approval, follow-ups, retries, local restoration, new
files, conversation isolation, provider/credential/protocol changes, import, reset
and malformed saved consent. Native build and runtime verification are pending.
