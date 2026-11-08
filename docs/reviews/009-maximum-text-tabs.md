# Maximum-text tabs and full-flow recheck

8 November 2026. Independent GPT-6 Astra review of workflow 42485786534, app JS/flows `2f7b4f0`, native seed `d77f2c0`, iOS 26.2. All profile provenance matches. Typecheck and 37 tests pass; source CI passes. No reviewer edits.

**86/100 provisional, gate not met.** Task 24/25, navigation 18/20, visual 16/20, accessibility 12/15, trust/recovery 9/10, native 7/10. No high/critical finding established.

New medium product finding: the agent's horizontal tab row does not wrap. At maximum text, Memory is x370/width186 on a 440-point screen (37.6% visible). Vertical scrolling cannot reveal its offscreen horizontal part. Fix wrapping/stacking while retaining the full-visibility test, then complete maximum-text memory and agent composition.

Verified: maximum-text creation now succeeds; compact empty introduction no longer clips; ordinary single/multiline composers clear the keyboard on all profiles. Compact and large pass exact-memory save/relaunch and agent multiline composition, including context hidden while typing/restored afterward. Exercised dismissal controls are fully onscreen and 44×44. Maximum-text memory and agent composition were not reached.

The reviewer inspected 39 actual images (14 compact, 14 large, 11 maximum-text), command results, failure AX and driver diagnostics, retained under ignored `artifacts/review-full-matrix/`. Recovered startup retries do not explain the tab overflow. These are JS-on-native results, not fresh signed-binary approval.

Separate gaps: exact live recall and VoiceOver on the owner's physical device; populated responses, long history and rendered errors/recovery; live streaming/lifecycle. Send clearance is verified, Send execution/model recall are not. Source correction after review makes the tab row wrap and constrains each tab to the available width, preserving 44-point targets; native verification remains required.
