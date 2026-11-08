# Nylo product design reset

8 November 2026. The owner rejected build 8's interface as looking like a generic generated prototype and named ChatGPT and Grok as the quality references. Store submission stays on hold while this design reset is implemented and assessed in actual native renders. Earlier numerical reviews do not approve the new design or override owner feedback.

Reference inspection: current store screenshots fetched through Apple's public lookup API and visually inspected for [ChatGPT](https://apps.apple.com/us/app/chatgpt/id6448311069) and [Grok](https://apps.apple.com/us/app/grok/id6670324846). Local reference files and provenance remain in ignored artifacts/design-reference. No reference image, brand or proprietary asset is bundled into Nylo.

Useful patterns: conversation content dominates; navigation is compact; user bubbles are neutral; message actions sit beside the answer; model controls use less visual space. Nylo keeps its own agent/memory model and stable Chats, Agents and Settings navigation. Features such as voice, image generation or browsing shown by those reference products are outside this release's scope.

## Direction implemented

- White canvas, neutral ink and quiet gray surfaces. Primary actions use ink; jade remains a limited identity/status accent. Existing Nylo icon is preserved.
- Conversation lists emphasize title, preview and time, without identical decorative chat icons or redundant disclosure chevrons. Agent identity appears only where it adds context.
- Chat removes repeated assistant branding and the duplicated uppercase conversation title. User bubbles, readable answer typography and compact message actions carry the conversation. Earlier model attribution remains visible when it differs from the selected model.
- Composer uses a quiet filled surface and circular send control. Its model selector and keyboard-dismiss action keep 44-point targets. Repeated stationary footer copy is removed; active/interrupted states remain explicit. Quick starters insert an editable draft and focus the composer; they never send automatically.
- Agent workspaces use a compact identity header, adaptive conversation/memory control and inspectable memory rows. Starter roles open a prefilled form; instructions/memory remain separate for each agent.
- Settings uses grouped native rows for providers, device data, help and advanced checks. Backup/restore/delete confirmations and provider-cost/privacy disclosures remain in their actual flows.
- Navigation titles have a bounded text multiplier, while reading, drafting, memory and form content retain dynamic type. Agent initials are decorative identity marks with bounded scaling.

## Verification required

Source typecheck, 43 behavioral tests and credential checks pass. Neutral palette contrast: ink/white 17.00:1, secondary/white 5.45:1, secondary/filled surface 4.96:1. These measure solid colors, not complete rendered accessibility.

Review 014 found that the first reset still fell short of the requested product quality. Follow-up removes raw formatting from previews, prevents quick starters replacing drafts, confirms replacement of edited role setup, makes the frequent model action a focused picker, consolidates provider headings and puts Advanced after key/model essentials. Short empty-state headings and earlier actions replace promotional copy at accessibility sizes. Keyboard dismissal uses a fixed navigation target and explicitly blurs the composer; the original single-tap native assertion remains required. The gallery now checks actual model selection, starter safety and cancelled/confirmed role replacement with synthetic offline data.

Run compact, large and maximum-text smoke against this exact app bundle. Inspect populated inbox, ordinary/agent responses, memory, provider setup, Settings and keyboard frames. Strengthen the long-history fixture with full last-answer visibility; opening near the end is insufficient. Retain synthetic fixture disclosure, exact clipboard comparison, restart and personal-draft preservation checks. Obtain a fresh independent design review after actual renders, then build a new signed TestFlight candidate. Build 10 contains app source 6470912 and is Apple VALID; internal QA assignment awaits the completed populated-flow gallery. Build 8 remains the previous design until that assignment is verified.
