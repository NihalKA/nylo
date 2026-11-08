# Product reset review

8 November 2026. Independent GPT-6 Astra inspected e23f00e, actual current native images in artifacts/review-product-reset, all reference PNGs/provenance and relevant source. **79/100 provisional; design-beta assignment held.** Task 22/25, navigation 16/20, visual 15/20, accessibility 10/15, trust 9/10, native 7/10. Earlier score 87 does not approve the redesigned source.

The ordinary response screen is a substantive content-first improvement. Grouped Settings and normal-size memory views are convincing. However, the overall experience remains less resolved than the owner’s ChatGPT/Grok references.

- High-priority validation blocker: maximum-text smoke tapped Dismiss keyboard, but the keyboard/control remained. This is failed acceptance evidence, not a confirmed deterministic app defect. Later maximum-text memory/restart/composition steps were not reached.
- Medium: quick starters replace existing drafts; role templates replace edited setup without confirmation.
- Medium: actual inbox previews expose raw Markdown. Curated response fixtures do not establish broad Markdown rendering quality.
- Medium: oversized empty-state headings displace primary actions at maximum text.
- Medium: the model control opens general conversation settings with title editing ahead of model choice; provider setup has redundant headings and Advanced before essential key/model entry.
- Smaller concern: explicit accessibility labels omit visible preview/date/detail context. Actual VoiceOver remains unverified.

Gallery 42493326312 passed, including exact clipboard, full final-answer visibility, restart, approved test-memory restoration, cleanup and personal-draft preservation. Smoke 42493329891 passed compact/large and failed maximum text. All provenance identifies eae0718 native seed with refreshed e23f00e JS/flows, iOS 26.2. Full native 42493325798 subsequently succeeded. Signed candidate 42493668791 was cancelled and never assigned to QA.

Follow-up source changes protect drafts and confirm role replacement, normalize previews without changing original messages/copy, provide a focused model picker, consolidate setup and move Advanced after essentials, and shorten/adapt empty states. Keyboard dismissal moves to the fixed navigation header, explicitly blurring the composer, while retaining the unchanged single-tap disappearance assertion. Source typecheck and 42 tests pass, including draft preservation and plain-preview regressions. Fresh native evidence and independent recheck are required; no redesigned beta or production approval is claimed.
