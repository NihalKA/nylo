# Consent, recovery and onboarding review

8 November 2026. Independent reviewer: GPT-6 Astra. Reviewed commit `267b3ffd120a72ffe96de490dc66eac76c380465`; primary implementation GPT-6.1 Sol. Read-only review, typecheck and 33 tests passed.

**72/100, provisional; release gate failed.** Task clarity 22/25, navigation/setup 16/20, visual craft 13/20, accessibility 10/15, trust/recovery 7/10, native interaction 4/10. Current native evidence is missing; visual/native credit only reflects historical `337d99e` Chats and older failed UI-flow captures. TestFlight delivery is `ce00b58`, not this candidate.

Confirmed corrections: credentials use replacement slots before metadata activation; removal/restoration retire keys after metadata commits; backup projection removes credentials and sharing grants; checkpoint failures cannot silently become completed responses; discovery invalidates on key changes; composer clearing waits for durable acceptance; provider setup explains separate API access and saved versus tested status.

Five medium findings:

1. A new secret can be written before its slot is durably journaled. Interruption or failed rollback deletion leaves an undiscoverable secret. Journal before writing and clear pending retirement atomically with activation; cover failure boundaries.
2. Sharing approval persists across chats but the prompt only describes “this chat.” Disclose its remembered scope and provide a per-connection reset.
3. Chat promotion and reviewed initial memory are separate mutations. A second-write failure leaves a promoted agent despite reporting failure; retry can duplicate it. Commit all changes together.
4. Draft debounce/unmount does not cover background suspension. Flush on focus loss and background, then verify native suspend/relaunch behavior.
5. Draft rows omit preview and agent from accessible names. Give each a meaningful label; template chips also need an explicit 44-point minimum.

These findings are being corrected after the reviewed commit. Source changes alone do not establish native lifecycle correctness or raise the recorded score. Release still requires current small/large iPhone renders, accessibility text sizes and VoiceOver checks, physical-device results and an independent passing re-review.
