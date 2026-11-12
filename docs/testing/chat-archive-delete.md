# Chat archive and delete

Implemented on `feat/chat-archive-delete`, based on `origin/main` at
`84496fa5986e8e4b6482b82c5731f6aa44733191`.

## Behavior

- Swipe left on an existing chat card to reveal Archive and Delete. A full swipe
  never executes an action. Long press reveals the same controls; screen readers
  receive named Archive/Restore and Delete actions.
- Archive hides the chat from the main and agent lists without changing its
  contents, attachments, agent association, or original recency. An Archived
  link below search opens a searchable archive. Swipe or long press there to
  Restore or Delete. Restore returns the chat to its original lists.
- Delete asks for confirmation before removing the chat, its files that no other
  chat references, and its chat-specific sharing approvals. Saved agent memories,
  providers and other chats remain. This is local deletion, not provider-side
  deletion. Previously exported backups remain independent copies.
- A live reply can continue while archived. Deletion requires that chat's reply
  to finish or be stopped. A pending deletion cannot start a new response.
- Archive state survives local reload and backup round trips. Older saved data
  remains compatible. Failed writes retain the chat for retry.

## Verification

2026-11-12, working source from this branch:

- TypeScript and all 150 Node tests passed, including eight new lifecycle tests:
  persistence/restore, legacy parsing, blank reuse, scoped cleanup, shared files,
  failed writes, deletion/send races, live replies, and device-check protection.
- Repository formatting, credential scan, original asset/font checks passed.
- Historical audit-verifier regression suite: 35 tests passed. This is a retained
  verifier regression check, not a new Figma audit.
- Expo Doctor: 20/20 checks passed.
- Actual source loaded through Metro on port 8091 in existing Expo Go on the
  iPhone 17 Pro simulator, iOS 26.4, 402 × 874 logical points. No native app build
  or provider request was needed. A new isolated Expo project sandbox held only
  the synthetic draft `Archive and restore QA draft`.
- Manually verified closed card, swipe reveal, archive, archive persistence after
  app restart, archive navigation, long-press restore, delete cancellation,
  confirmed delete, dark appearance, vertical scroll, and Dynamic Type
  `accessibility-extra-extra-large`. Text size and appearance were restored to
  their original `large` and light settings after verification.
- Dynamic Type testing found and fixed action-panel misalignment when font size
  changes while open. Short action labels use the existing 1.6 text-size cap;
  full screen-reader action labels remain available.
- Local screenshots are in ignored `artifacts/chat-lifecycle/`: `ios-closed.png`,
  `ios-swipe.png`, `ios-archive.png`, `ios-delete-confirm.png`,
  `ios-large-text.png`, and `ios-dark.png`. Early captures precede the Dynamic
  Type alignment fix; large-text and dark captures include it. No design
  reference was supplied for this change.

Android UI and a distributed native binary have not been verified. The device
inventory reported Android unavailable because this Mac has no Android SDK.
No native compilation, release, merge, or provider-side data operation was done.
