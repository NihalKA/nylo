# Keyboard and memory UI recheck

8 November 2026. GPT-6 Astra reviewed matrix 42482545085: all 33 screenshots, command results, failure accessibility trees and driver diagnostics. Independently reran typecheck and 37 passing tests; no reviewer edits.

**82/100 provisional; gate not met.** Task clarity 23/25, navigation/setup 18/20, visual craft 16/20, accessibility 10/15, trust/recovery 9/10, native interaction 6/10.

Verified corrections:

- Large-phone composer overlap is resolved in single- and multiline screenshots. Input and Send clear the keyboard; maximum-text captured input/Send also clear it. Successful captures lack saved AX bounds, so measurements are visual.
- Keyboard dismissal and draft navigation/restart work across all profiles.
- Maximum-text Settings scrolls beyond its heading; readable provider access and NyloHQ selection succeed.
- Compact/large memory input targeting and entered-value assertions succeed. AX shows enabled Save, but it was not activated.

Remaining medium findings:

1. The native memory accessory's Done button is absent. Compact/large stop at its tap, with Save beneath the keyboard. Replace the missing UI with a verified reachable dismissal interaction; memory saving/relaunch remains untested, not disproved.
2. At maximum text, chat dismissal bounds extend to x455 on a 440-point screen. Constrain the connection label while preserving the 44-point target.
3. Compact's multiline screenshot precedes the appended line, although it appears after dismissal/restart. Assert the full entered value before a settled capture. Maximum text cannot complete the Create agent scroll path while the keyboard is open; establish dismissal and scroll reachability before drawing a product conclusion.

Provenance: iOS 26.2, SE3 and 17 Pro Max, native seed `d77f2c0`. Large JS `48064ba`; compact/maximum-text JS `1ba6db3` differs only by formatting. Pin checkout to avoid moving-main differences. Evidence is JS-on-native, not a new signed binary; files are retained in ignored `artifacts/review-keyboard/`.

No memory-save/relaunch, same-agent new-chat recall, VoiceOver or live-response credit. The owner's memory listing and synthetic adapter recall remain separate evidence. Source corrections after this review remove the unsupported accessory, add a header dismissal control for forms, constrain the connection label, assert multiline value, dismiss the setup keyboard and pin the test checkout. They await a new native run.
