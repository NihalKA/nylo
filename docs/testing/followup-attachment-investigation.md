# Follow-up attachment investigation

Reported 2026-11-10: attaching a file on the first prompt causes repeated requests
to send the file on later prompts. Scope: both iOS and Android.

Baseline: `86a57a8763bce39b29a8e903af972fc3371385b2`.

## Findings

`src/store.tsx` gathers all previous message attachments on every send and calls
`askPermission("Send attached content?", ...)` whenever any exist. Approval is not
remembered for attachments. This explains repeated **app permission dialogs** on
both native platforms; `src/consent.ts` uses the same native Alert implementation.
Confirmation of whether the report refers to this dialog or an AI reply is pending.

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

## Proposed fix and blocker

If the reported request is the permission dialog, remember approval for the exact
attachment content and provider destination within the conversation. Ask again for
new/changed content, changed destination or reset sharing permission. Do not let a
backup import grant approval or suppress first-send consent. Preserve file bytes
in subsequent requests. Add regression cases for cancel, retry, restart, provider
switch, newly attached files, import and revoked approval before native validation.

No product source has been edited: the baseline `implementation` gate fails for
unreviewed Figma scope and missing approval. The CI `changes` gate classifies all
`src/` edits as product changes, including nonvisual consent logic, and requires
approval on the pre-change checkout. The test/docs-only `changes` gate passes.
The gate has not been weakened. Both native builds and a verified product merge
remain pending; repository instructions prohibit a new compile for test-only work.
