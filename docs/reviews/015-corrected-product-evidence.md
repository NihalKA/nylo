# Corrected product evidence review

8 November 2026. Independent GPT-6 Astra reviewed clean 6350e69, references, source and current native artifacts. **81/100 provisional; product acceptance and store submission remain on hold.** Task 23/25, navigation 17/20, visual 15/20, accessibility 10/15, trust 9/10, native 7/10. No source edits or device/provider calls.

Actual inbox, Settings and provider setup are substantially more resolved; maximum-text empty-state actions are visible. Source fixes for starter preservation and role confirmation are sound. A focused picker is implemented. Actual VoiceOver and owner acceptance remain unverified.

High validation blocker: maximum-text smoke 42495919456 failed locating the first Settings provider row before reaching keyboard, draft, memory or agent composition. The log finds the row partly above the viewport and continues downward. This is failed navigation evidence, not a proven app defect. Compact and large complete smoke passed.

Medium fixture defect: gallery 42495916827 still used title-only row selectors after accessibility labels gained previews/dates. The actual inbox and AX tree exist; all conversation-level assertions were blocked by the first selector. New picker, starter, role-confirmation, clipboard, persistence and cleanup outcomes cannot be inferred from flow source.

Low: preview cleanup and response rendering cover limited formatting; remaining preview emphasis/strike/quote syntax needs cleanup. Original response/copy preservation is sound. Evidence under artifacts/review-product-corrected identifies e23 native seed, refreshed 6350 JS/flows, iOS 26.2. Full native 42495916932 was still running at bounded review end.

Follow-up retains full-visibility assertions, waits for Settings to settle and scrolls upward to its first provider row. Gallery selectors match each unique title prefix plus richer context. Preview cleanup adds emphasis/strike/quote handling with an arithmetic/identifier regression, without claiming general Markdown support. Typecheck and 43 tests pass. Fresh captures remain required.

Reviewer narrowly supports a traceable, newly signed **internal design-feedback/device-validation beta**, with explicit gaps, to obtain owner evidence. This is not design or production approval. Build 9 was cancelled; build 8 remains the older owner-QA version until a corrected candidate is processed and assigned.
