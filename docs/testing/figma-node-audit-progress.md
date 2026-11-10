# Per-node audit findings — work in progress

This is inventory analysis, not rendered acceptance. Productdcef is unchanged.
Direct MCP context facts are retained in `../design/figma-context-facts.json` with
each original context's SHA. The9 contexts identify739 metadata nodes directly.
The remaining91 current nodes are vectors rendered through image wrappers; their
individual wrapper/source-artwork reconciliation remains required. Adding the491
earlier-frame nodes and one canvas accounts numerically for all1,322 baseline nodes.
Numerical coverage does not approve any unreviewed item or undiscovered domain.

## Explicitly inspected Settings nodes

| Node              | Reference / current source                                       | Disposition                                                                                               |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 2:498             | Simulated9:41, Inter700/14/20                                    | Native system status/time; no fake app status bar                                                         |
| 2:500–505         | Three simulated radio/wifi/battery wrapper/vector pairs          | Native status indicators; preserve real safe insets                                                       |
| 2:508             | Nimbus700/16/24, tracking−0.4                                    | Maps to Settings title; inherited700 in `s.title` selects real Nimbus Bold                                |
| 2:512,530,554,576 | Nimbus700/12/18, tracking0.6, uppercase                          | Maps to four section headings;4px inset preserved                                                         |
| 2:521,585         | Jakarta600/18/24, tracking−0.45                                  | Maps to Connect/Live-check row titles; actual saved-provider state uses real data                         |
| 2:523             | Inter400/14/20, explicit two paragraphs,205.14px measured column | Planned gap: flex text at411dp can collapse reference's two-line rhythm                                   |
| 2:538,547,562,571 | Inter500/16/24, tracking−0.4                                     | Maps to backup/privacy/support row labels; actual actions/confirmations preserved                         |
| 2:596             | Inter500/16/24, destructive ink                                  | Maps to destructive local-data row; protected confirmation/disabled state retained                        |
| 2:527,551         | Nimbus400/13, secondary disclosure                               | Maps to provider/backup disclosure; source line metrics21/21.13; same-width native recheck still required |
| 2:587             | Inter400/14/20                                                   | Maps to live-check detail. Keep honest real behavior; same-width wrapping still required                  |

The page, grouping containers, remaining artwork/shadows/navigation and all state
variations still require their own dispositions. These reviewed targets do not
silently approve their descendants or the final native renders.

## Additional report finding

Node2:873 is Liberation Mono Regular12px with16px line height. In productdcef,
`app/report.tsx` renders the model line at12px/18px. This is an additional planned
metric correction. Keep actual model identity and report payload unchanged. The
preview heading/body remain separate type roles; owning fonts/assets does not prove
that every line height is applied. The complete report action-cluster spacing and
all remaining nodes/states still need full review before implementation.

## Fresh complete-file reconciliation

The current .fig and14 PNGs were acquired from the working signed-in browser at
11:51–11:56UTC. The file contains1,325 records: all old1,322 plus document0:0,
empty hidden internal canvas0:2 and visible check-vector2:1098 omitted by metadata.
Thus the current render hierarchy has739 directly identified context nodes and92
additional vector IDs. Three vectors are already directly identified in the739;
there are95 current vectors in total. The older count above describes the original metadata snapshot.
Use the fresh compressed render facts and original reference PNGs for all remaining
reviews. This acquisition is not native acceptance or an automatic node approval.

The static context extractor now includes NoSubstitutionTemplateLiteral strings,
including the complete instructions and Save & start agent label. Its two tests
also reject duplicate IDs and flag dynamic text rather than silently omitting it.

## Complete font-role enumeration

The recursive fresh-file scan includes `textData.styleOverrideTable`, not just
top-level text styles:251 text nodes contain262 font-name occurrences and11
distinct design faces. `docs/design/figma-font-audit.json` retains every node and
property path, maps each face to its unchanged bundled font/hash/runtime alias,
and records the extra twelfth runtime face (Mono Bold for app extensions).
The actual source SFNT guard passes all12 faces. This closes used-file font-role
enumeration; it does not approve per-node font selection/metrics or native use.

Three missing original SVG variants have now been exported from the working
browser. See `figma-artwork-state-audit.md` for exact state bindings, fractional
painted bounds versus rounded export extents, and remaining slot review work.

## Settings: explicit123-node source/reference review

`docs/design/figma-settings-node-audit.json` records each individual node2:494–616,
its actual property digest, source target and disposition. No descendants were
approved by ancestry. This covers the two distinct description columns205.14/
181.45, four grouped cards, all17 app vectors and mockOS exceptions. Additional
plans record first/later separator ownership, disclosure21 versus21.13 leading,
tab label14 leading and selected disc50.425×22.333 versus source50×24. Native
safe-area/44pt exceptions remain confined to their actual purpose. Original
reference properties and source observations still require new rendered proof
after implementation. Earlier Settings1:* nodes are not silently approved.

Settings' source state inventory includes provider empty/configured, selected tab,
operation error/success/busy/disabled, each destructive/backup confirmation and
cancellation, and external destinations. There is no direct Settings text input;
only that direct keyboard state has a narrow exception, with downstream provider/
editor/native transitions retained separately. Other screens/states remain open.

## Earlier/current complete-property reconciliation

All491 earlier/current pairs have now been compared using **every retained render
property**, plus parent relationships, in `docs/design/figma-earlier-current-pairs.json`.
The486 non-root pairs match exactly; the five root transforms differ only by2110px
document x placement. This is stronger than the earlier metadata/ID-prefix match.
Original PNGs still retain their observed small raster differences; equal design
properties are not represented as byte-identical exports.

Only124 pairs whose current targets already have explicit source dispositions are
now marked duplicate (123Settings plus the separately reviewed report model line).
The other367 pairs remain unreviewed alongside their targets. Earlier Settings'
states are retained as explicit duplicate exceptions tied to the corresponding
mandatory currentSettings obligations; no state is silently removed. This closes
identity reconciliation, not source review of the remaining screens or native
visual acceptance.

## Memory: explicit110-node source/reference review

`docs/design/figma-memory-node-audit.json` records every node2:617–726 with
actual property digest and a source target/exception/plan. Local field/section
grouping, leading, disabled plus-label gap6, avatar/textarea/segment shadows,
selected paint, date gap4, switch thumb and docked surface are recorded separately.
The profile's clipped mock description is an explicit measured exception; full real
text and44pt memory actions remain required. Native rendered correction is pending.

The matching110 earlierMemory pairs are now individually marked duplicate only
after their current target's source review. Earlier/current raster differences stay
retained; states are explicit duplicate obligations tied to mandatory current proof.
Memory's23 source states include creation/edit/cancel/limit/forget, context consent/
review/disabled, both conversation-list states, missing/diagnostic-agent guards and
delete confirmation/cancel. No new provider requests or data mutations occurred.

Current count:853 unreviewed,234 reviewed duplicate pairs,201 source-mapped nodes
and37 narrow exceptions. Context and other screen node/state reviews remain open.

## Expanded Context:89 records, five contracts explicitly unresolved

`docs/design/figma-context-node-audit.json` accounts for all89 nodes2:1050–1138.
Source/paint/metric plans or narrowOS exceptions now cover84; date nodes1071/1072
and Delete recent items nodes1076/1077/1078 remain unreviewed because the file
stores no binding/behavior contract. No sample date or destructive behavior is
invented. The distinct expanded hierarchy, dedicated header/subheader, nested
preview roles/borders/shadows and timeline-dot alignment are retained findings.
The five unresolved records continue to block completeness.

Current count:770 unreviewed,234 duplicate,272 source-mapped and49 narrow
exceptions. No product change or corrected native acceptance is inferred.
