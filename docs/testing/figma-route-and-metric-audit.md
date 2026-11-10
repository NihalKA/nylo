# End-to-end routes and newly measured typography gaps

Audit only, productdcef unchanged. These source/reference findings are implementation
plans awaiting complete scope review and Astra approval, not changes already shipped.
MCP reads remain quota-limited, but a fresh normal browser tab now works. The complete
current .fig and14 original PNGs were acquired11:51–11:56UTC. The values below must
be reconciled with those fresh facts and source; no cached substitute authorizes code.

## Every existing app surface

| Source surface          | Figma / extension scope                          | Required state accounting                                                                                                                                                           |
| ----------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| app/_layout.tsx         | app-shell extension                              | Storage/font loading, font/storage errors, ready/recovered, native status/safe areas                                                                                                |
| app/(tabs)/_layout.tsx  | app-shell extension / frame navigation           | All three selected tabs, real OS insets, large text and back/route behavior                                                                                                         |
| app/(tabs)/index.tsx    | chats-inbox extension                            | Empty/populated, search/no results/clear, missing provider, drafts/attachments, errors                                                                                              |
| app/(tabs)/agents.tsx   | agents-landing extension                         | Empty/template entry, populated, memory counts, long real names, large text                                                                                                         |
| app/(tabs)/settings.tsx | 2:494                                            | Unconfigured/configured providers, backup/restore/delete confirmations, busy/disabled/error/success, licenses link                                                                  |
| app/agent/edit.tsx      | 2:727 plus advanced extension states             | New/edit/from-chat, role selection/dirty cancel, colour, fixed Save/keyboard, expanded options, validation/error                                                                    |
| app/agent/[id].tsx      | 2:617 / 2:1050                                   | Conversations/memory, empty/saved/editing memory, context opt-in/review/hide, current goal, delete confirmation, missing agent                                                      |
| app/chat/[id].tsx       | 2:896 / 2:986 / 2:1139 / 2:1234 plus live states | Empty/populated, attachment shelf/removal, real picker/cancel/error, model/search/groups/PDF format guidance, stream/stop/error/background interruption, keyboard/draft restoration |
| app/connection.tsx      | provider-editor extension                        | Provider list/new/edit/unavailable, protocol/preset/model selection, catalog/manual entry/error, key/consent/save and PDF guidance                                                  |
| app/device-check.tsx    | live-check extension                             | Prepare/consented request/result/recall/reopen/cleanup/error; no extra provider calls authorized for this audit                                                                     |
| app/licenses.tsx        | font-licenses extension                          | Complete selectable legal copy, long scroll, safe back, larger text; no supplied standalone Figma frame                                                                             |
| app/report.tsx          | 2:814                                            | Empty/details, excerpt OFF default/explicit ON, exact copy, email unavailable, remove confirmation/disabled/error                                                                   |

Native Photos/Files/Camera permission and email/share UIs are platform-owned
transitions. Record their entry/cancel/recovery and geometry; do not imitate their
UI or claim their full contents match an app design frame. Missing standalone
references are design-system extensions, never invented exact Figma matches.

## Additional direct metric findings

Reference values come from exact node classes/paragraphs in the retained official
contexts, matched to source code and its inherited styles. A source metric mismatch
is evidence for a plan; the later native comparison must verify the resulting layout.

| Node(s)                                                                    | Reference                                                  | Productdcef source / plan                                                                                                                                            |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2:648 / 2:651                                                              | Profile name18/22.5, description14/20,2px text gap         | Name has no explicit leading; description inherits21; gap7. Set measured metrics without clipping real text.                                                         |
| 2:666 / 2:679 / 2:697                                                      | Memory headings16/24                                       | Source headings lack explicit24px leading. Preserve weight700 and semantic headings.                                                                                 |
| 2:688                                                                      | Memory date Inter600,11/14, tracking0.33                   | Collapsed memory uses400 and inherits21px line height. Keep real localized date; correct the collapsed-state typography. Expanded context has its own12px date role. |
| 2:681 / 2:705 / 2:1100                                                     | Explanatory copy12/19.5                                    | Source saved-memory/context explanations use18px leading. Preserve full disclosure/consent wording.                                                                  |
| 2:1118 / 2:1120 / 2:1122                                                   | Secondary context/callout copy12/16                        | ContextPreview applies18px to secondary/callout paragraphs. Keep first-role/body14/20 and bold spans separate.                                                       |
| 2:873                                                                      | Model metadata mono12/16                                   | Source12/18. No change to actual model identity or exact report payload.                                                                                             |
| 2:877                                                                      | Report body mono13/21.13                                   | Source13/20. Preserve actual user details and fallback text.                                                                                                         |
| 2:857                                                                      | Optional excerpt explanation12/16                          | Source12/18. Keep privacy opt-in OFF by default and full honest guidance.                                                                                            |
| 2:900 / 2:902                                                              | Files greeting28/36 and subtitle14/20;8px gap              | Source greeting has implicit leading, subtitle inherits21, gap16. Respect keyboard-hidden greeting and actual user data.                                             |
| 2:990 / 2:992                                                              | Attachment-menu background greeting32/40 and subtitle16/24 | Source switches title size32 but leaves subtitle14/21. Account for this supplied state rather than styling only the foreground sheet.                                |
| 2:1008                                                                     | Attachment-menu background New chat18/24                   | Source empty header remains22/28. This is a reference state difference requiring explicit disposition, not a safe-area exception.                                    |
| 2:1177                                                                     | PDF guidance12/19.5                                        | Source12/18. Keep accurate API/model capability guidance and no fake PDF-supported badge.                                                                            |
| 2:1182 / 2:1184 / 2:1210 / 2:1212 / 2:1301 / 2:1315                        | Provider headers/protocol metadata12/16                    | Source inherits s.sub21px in these rows. Preserve dynamic names and real protocol.                                                                                   |
| 2:1230                                                                     | PDF picker footer12/16.5                                   | Source12/18; ordinary model footer2:1321 intentionally uses18. Do not globally flatten distinct states.                                                              |
| 2:658 / 2:676 / 2:887 / 2:895 / 2:1027 / 2:1035 / 2:1043 / 2:1048 / 2:1323 | Shared action labels14/20                                  | Shared Button has no explicit20px leading; make target metrics explicit after review and retain44pt-or-larger reachable controls.                                    |

The segmented memory switch deserves a correction to an earlier audit suspicion:
reference2:659 is48px; source44px minimum tabs plus its padding/border also yield
48px at standard text. Its selected paint is38px high, as in2:662. Do not enlarge
it on the mistaken assumption it is46px. Review horizontal painted insets at the
same logical width before deciding whether they differ; retain44pt hit regions.

Create-agent role600 versus source500 and8/4px field-label gaps remain planned
findings.36px swatches in44px hits plus6px wrapper gaps produce50px centres, matching
the reference36+14px visual spacing; do not make an arbitrary swatch-spacing fix.

No source changes are authorized by this document. Hidden/component/style/prototype
scope and remaining per-node/state reviews are still open; the audit is not10/10.
