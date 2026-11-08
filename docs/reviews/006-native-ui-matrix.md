# Native UI matrix review

8 November 2026. GPT-6 Astra independently reviewed app source `d77f2c0` (app/src unchanged through `9ff77ca`). Typecheck and 37 tests passed. No reviewer edits.

**76/100 provisional, release blocked.** Task clarity 23/25, navigation/setup 17/20, visual craft 14/20, accessibility 9/15, trust/recovery 9/10, native interaction 4/10. Both previous medium findings—consent revision migration and serialization of whole credential transactions—are resolved.

The reviewer inspected 22 screenshots, commands, accessibility trees and driver diagnostics from failed matrix run 42481190022. Provenance: iOS 26.2, native seed `a8768b6`, refreshed JS `eb1cf3a`, matching reviewed application source. These are JS-on-native simulator results, not a fresh signed binary. Evidence and hashes are retained in ignored `artifacts/review-current/`.

Findings:

1. **High:** keyboard obscures the typed composer and part of Send on iPhone 17 Pro Max. Correct safe-area/keyboard handling; inspect settled single- and multiline bounds.
2. **Medium:** maximum text size makes the fixed Settings heading wrap and consume 330 points. Move it into scrolling content and adapt display typography, preserving body-text scaling. Provider reachability after scrolling was not disproved.
3. **Medium:** the memory automation tapped the 17-point label, not its input, then attempted disabled Save. Add a test ID, assert the entered value and enabled Save. Replace unreliable compact keyboard dismissal and center provider controls before tapping. These failures do not establish memory data loss.

Coverage:

- Compact/SE3: first use, tabs, NyloHQ selection and typed composer. Draft relaunch and agent flow unverified.
- Large/17 Pro Max: those flows plus draft navigation/relaunch, Writing partner creation and empty Memory. Memory save/relaunch and keyboard clearance unverified/failed.
- Maximum text/17 Pro Max: Chats, Agents, Settings and tabs. Provider setup and later flows unverified.

Default-size screens are restrained, consistent and clear. Current renders support partial visual/native credit, while missing states remain unverified. Publication requires resolving the composer blocker, completing accessibility/core-flow evidence, and further physical-device confirmation. The owner confirms saved-memory listing on iPhone 17/iOS 26.6.2; exact-fact recall remains unconfirmed.

Source corrections are in progress after the reviewed commit. Do not mark them natively verified until the rerun succeeds and actual images/bounds are reviewed.
