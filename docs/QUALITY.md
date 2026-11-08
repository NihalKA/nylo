# Quality and independent review

The user approved delivery on 8 November 2026 with iOS publication first, Android publication later, and an independent model score at every material milestone. Primary implementation: GPT-6.1 Sol. Independent reviewer: GPT-6 Astra. Claude is currently disabled in this environment; no claim of Claude review is made.

## Rubric (100 points)

- Task clarity: 25. A new user can identify and complete the primary task.
- Navigation and setup: 20. Stable locations, preserved work, progressive technical settings.
- Visual hierarchy and craft: 20. Real rendered screens, typography, spacing, restraint, consistency.
- Accessibility: 15. 44-point targets, text scaling, VoiceOver, contrast, focus and keyboard clearance.
- Trust and recovery: 10. Accurate data sharing, saved/tested distinction, errors, interrupted work, consent.
- Native interaction: 10. Actual install, gestures, keyboard, safe areas, list performance and transitions.

Target: at least 88/100 from the independent reviewer, no criterion below 80% of its available points, and no unresolved critical/high findings. This is a review threshold, not a claim of measured user satisfaction. Never award unverified native/rendered points based only on source code. Human first-use feedback and physical-device evidence remain separate release gates.

## Milestones

1. Baseline / architecture: source review and evidence gaps.
2. Navigation + first-use design: source and actual small/large iPhone renders, empty and populated states.
3. Core flows: setup → first response → reopen; agent → memory → next conversation; errors/recovery.
4. Release candidate: signed native beta, accessibility and physical-device evidence, CI/signing/privacy.
5. Store launch: final metadata/screenshots, reviewer access, deployed policy/support, production readiness.

For each milestone: implement → self-assess with evidence → fresh independent review → fix material findings → fresh independent re-review if needed. Store dated findings, exact reviewed commit and evidence paths in docs/reviews. A numerical pass cannot override data loss, credential exposure, broken core flows, review access failures, or store rejection. Do not repeatedly request a friendlier score without new evidence/changes.

## Baseline review, 8 November 2026

Independent source-only score: **56/100**, provisional. Task clarity 14/25; navigation/setup 10/20; visual craft 11/20; accessibility 8/15; trust/recovery 8/10; native interaction 5/10. No rendered or native approval.

Findings: hero before chats; agent conversations absent from inbox; provider setup exposes technical details and cannot distinguish working access; sub-44-point targets; memory consent relies on model instructions. Fixes are underway. Source import was reviewed before its first implementation changes; baseline is not a score for the current revised UI.

## Evidence accounting correction

The second source review at commit 337d99e withholds all 30 visual/native points until rendered/runtime evidence exists. Its 46/100 is not directly comparable with the looser baseline. See reviews/002-source-review.md. Use this stricter convention from now on.

## Design references and decisions

Research checked 8 November 2026:
- Meta's original WhatsApp interface/design article and its visual examples: https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/
- Apple tab-bar guidance: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Apple accessibility guidance: https://developer.apple.com/design/human-interface-guidelines/accessibility

Use reference images to study hierarchy, touch reach and density, not to copy branding, assets or an entire screen. Revisit relevant reference images at each UI milestone (inbox, provider setup, chat composer, agent memory), record the takeaway, and evaluate real Nylo screen states.

Direction: conversation-first universal Chats inbox, separate Agents library, stable bottom Settings location, familiar iOS large titles and search, restrained jade accent, readable white surfaces. No landing-page hero, decorative dashboard metrics, unnecessary gradients, or fictional sample history in the real app. Polished empty states must explain the next action. Populated states must preserve visual calm and support large text.

## Provider setup research, 8 November 2026

Consulted Apple sheet/search guidance and iOS list references for the model picker: https://developer.apple.com/design/human-interface-guidelines/sheets and https://developer.apple.com/design/human-interface-guidelines/searching. The takeaway is one focused, dismissible selection task with search, a visible selection and an immediate return to the form; avoid an unbounded inline catalog that pushes Save offscreen. Current source adds a model sheet and an explicit NyloHQ preset after its Responses endpoint was verified live. These changes require native-render review before receiving craft points.
