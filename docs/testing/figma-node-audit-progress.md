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
