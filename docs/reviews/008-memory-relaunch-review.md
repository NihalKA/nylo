# Memory relaunch and maximum-text review

8 November 2026. GPT-6 Astra inspected all 35 screenshots, command results, failure accessibility tree and driver diagnostics from workflow 42484265871. No reviewer edits.

**86/100 provisional; gate not met.** Task clarity 24/25, navigation/setup 18/20, visual craft 16/20, accessibility 12/15, trust/recovery 9/10, native interaction 7/10. No high/critical finding established.

Compact and large profiles passed. Both entered the exact fact, used the reachable 44-point header dismissal, activated enabled Save, and displayed “QA sample: I prefer concise answers.” in a saved card after stop/relaunch, with the editor cleared. This verifies saved-list persistence on those simulators, not model recall.

Also verified: maximum-text chat dismissal is fully inside the screen at [376,248]–[420,292]; compact single/multiline input and Send clear the keyboard, with the asserted second line visible; draft relaunch and provider selection complete across profiles.

Remaining findings:

- **Medium:** maximum-text Create agent scrolling opens the keyboard after the conditional dismissal was skipped. Header dismissal remains reachable, but the scroll command fails after five swipes. This is a failed test path, not proven permanent creation failure. Dismiss after scrolling as necessary and complete creation/memory save/relaunch.
- **Low:** compact empty-chat heading clips while the keyboard is open; input/Send remain usable. Adapt/hide the empty introduction in the reduced viewport.

All profiles used pinned JS/flows `24aaba22b4bcec417fd38212f3ea2b6a5793916e`, native seed `d77f2c0`, iOS 26.2, SE3 or 17 Pro Max (accessibility XXXL for maximum text). Evidence is retained under ignored `artifacts/review-memory/` and is explicitly JS-on-native.

No approval for all-profile memory, a fresh signed binary, VoiceOver, live streaming/lifecycle, or exact recall on the owner's iPhone 17/iOS 26.6.2. Source corrections after this review hide empty introduction/context decoration while typing, dismiss form keyboards on drag, use bounded scroll/dismiss attempts and extend checks to an agent's multiline composer. They await native verification.
