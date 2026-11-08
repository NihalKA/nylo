# Recovery recheck and current-evidence accounting

8 November 2026. GPT-6 Astra independently reviewed `1079f85` read-only; typecheck and 36 tests passed.

**58/100 provisional, release gate failed.** Task clarity 23/25; navigation/setup 17/20; accessibility 11/15; trust/recovery 7/10. Visual 0/20 and native 0/10 withheld because available renders do not represent the current candidate. This is 58 of 70 assessed points, with 30 unverified points. It is not directly comparable to review 004’s 72, which carried historical visual/native credit. Use this current-build evidence rule consistently going forward.

Confirmed fixes from review 004:

- Pre-write credential journaling, activation and staging exclusion are correct for an isolated save.
- Consent wording and reset accurately describe the remembered scope.
- Promotion commits agent, conversation association and reviewed initial memory atomically.
- Drafts enqueue saves on focus loss and background/inactive transitions; actual suspension remains unverified.
- Draft accessible labels include agent/preview, and template targets have a 44-point minimum.

Two remaining medium findings:

1. Earlier revision-1 approvals survive the changed disclosure. Bump consent revision to force renewed approval after upgrading.
2. Metadata serialization does not serialize the whole credential transaction. Concurrent replacement/removal can resurrect a removed connection; two replacements can orphan the first new slot. Serialize save/remove/restore/cleanup including their reads and SecureStore operations.

Both findings are corrected after the reviewed commit, with migration and overlapping-operation regression checks. They require verification in the eventual candidate; no new passing score is claimed.

The reviewer inspected all five native `8cd0e0d` images in `artifacts/ui-fourth/`, showing Chats, Agents, Settings, provider setup and a visible composer. They do not verify current provider/memory UI. The exact composer-label failure was a selector mismatch; a stable test ID is now present, but no completed native rerun establishes success.

Agent memory strip and context copy clarify v1: instructions/approved facts carry over, earlier full transcripts do not. Synthetic recall proves that prompt path, not the owner’s exact saved-fact phone test. Current native renders, lifecycle/core-flow completion, accessibility/VoiceOver and physical-device details remain release gates.
