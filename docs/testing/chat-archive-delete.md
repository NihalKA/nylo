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

- TypeScript and all 156 Node tests passed, including eight new lifecycle tests:
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

At this initial verification checkpoint, Android UI and a distributed native
binary had not been verified. The device inventory reported Android unavailable
because this Mac has no Android SDK. No native compilation, release, merge, or
provider-side data operation was done at that checkpoint.

## Native build delivery — 13 November 2026

Before merge, the branch was rebased onto latest main
`1034961d18c640fd2822721c1b7e09f6e8d92d9b`. Main's intervening changes affect CI
runner selection and test fixtures; application/native inputs are identical to
all three candidates below. TypeScript and all 156 tests pass after the rebase.
Temporary feature-branch workflow allowances and the task's temporary Apple
build policy were removed after the builds completed.

- [iOS simulator build 43279757486](https://github.com/NihalKA/nylo/actions/runs/43279757486)
  succeeded on `b18c6d9ce73b53403f6a0d83c45d317afb695bc3`. Downloaded archive digest
  and ZIP CRC, actual bundled source marker, archive/delete strings, executable
  and JS hashes, and all 45 original SVGs plus 12 fonts independently verify.
  The native launch screenshot was inspected and shows the existing chat screen.
- [Signed iOS build 39](https://github.com/NihalKA/nylo/actions/runs/43282922670)
  succeeded on `0830b9c24b869c38c18cee2e06f6904aff13e9f8` using main's corrected
  Intel signing runner. The prior queued build 38 was cancelled before any job
  started. Downloaded CI receipts verify the actual exported IPA signature,
  original distribution certificate/team/profile, build/version, source marker,
  privacy declarations and 12 fonts. IPA SHA256:
  `81382187209a12ab03544ab8a49b170cfaf5cb8dab6698d8760b1742543489a5`.
  Apple independently reports 1.0.0 (39) VALID and IN_BETA_TESTING in the existing
  internal Nylo Device QA group. English release notes were saved and read back;
  previous selected builds and group settings were preserved. Installation on a
  physical phone remains unobserved. External beta groups were not changed.
- [Android signed build 38](https://github.com/NihalKA/nylo/actions/runs/43280872972)
  succeeded on `fc179386626cabf71d70122cf419a0950d5e516c`. Original GitHub archive
  digest and ZIP CRC verify. Actual APK source marker, bundle hash, archive/delete
  strings, all 57 original assets/fonts, APK/AAB hashes, and compiled signing,
  original certificate and restricted-permission receipts pass independent checks.
  APK: 67,776,398 bytes, SHA256
  `0cc05366563679a7953afe688036d0c9265bd1800cbdf55959216b385f388a17`.
  AAB: 47,585,797 bytes, SHA256
  `ab41b0c07eb0cbb06fb557831ac1f18b6b214704dccfaa6cd3999dc6b30d4836`.
  The verified APK was copied to a local download outside the disposable task
  checkout. No public release or Play upload was created.

The iOS simulator, signed iOS and Android candidates intentionally retain their
original source markers. Later CI, fixture and documentation changes do not
change the tested application/native inputs. Android runtime/gesture testing,
physical-device installation, VoiceOver/TalkBack, and new live-provider checks
remain unverified; build success is separate from those checks. No Play upload,
App Store submission, provider request, or change to saved provider behavior was
made by this task.
