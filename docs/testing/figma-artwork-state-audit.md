# Original artwork and state bindings

Audit in progress, 10 November 2026. Product `dcef4f6` is unchanged. This records
actual reference/source differences, not implementation or native acceptance.

The complete fresh file contains **95 current vectors**: 52 with retained MCP
asset-symbol mappings, 14 additional exact geometry aliases, 27 simulated OS
status vectors, one photo placeholder and one distinct PDF search vector.
The 739 context IDs already include three vectors; the additional 92 vector IDs
are not the total number of vectors. Shape aliases still need independent paint,
opacity, callsite and placement checks. Enumeration does not approve the slots.

## Fresh original exports acquired

The authenticated browser Properties panel confirmed each selected node's size and
paint. Normal SVG export completed for all three missing variants, with unchanged
download bytes retained under `docs/design/reference-20261110/svg/` and hashes/
times in `docs/design/figma-live-source.json`. No hidden application API was used.

| Node   | Actual glyph                                  | Original SVG viewbox | Source discrepancy / proposed use                                                                                                                                       |
| ------ | --------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2:1069 | 16.5×16.5, #1A1C1C                            | 0 0 17 17            | Context header currently uses navy `options`; use this original grey variant after audit approval.                                                                      |
| 2:1205 | 14.25×14.25, #767680                          | 0 0 15 15            | PDF search currently uses the ordinary 15px painted search. Keep this smaller original PDF variant.                                                                     |
| 2:1195 | 13.5833×10.0208, #767680 at 50% paint opacity | 0 0 14 11            | Disabled PDF selected check currently uses navy `modelCheck`; preserve the actual conditional selection and row opacity, rather than inventing a second selected model. |

Normal SVG export rounds the outer export extent to integer pixels. The glyph's
painted bounds remain fractional. Do not shrink the entire 17px SVG to16.5px and
thereby shrink its painted glyph again. Match painted bounds/centres explicitly;
retain original SVG bytes, viewbox and fill-opacity. A correct file hash alone
does not establish a correct displayed size.

## Additional state-specific callsites

| Node   | Actual reference                                         | Current binding / required plan                                                                                                                                                   |
| ------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2:1065 | Context back, 9.8125×16.6667, #1A1C1C                    | `AgentHeader` always uses larger navy `memoryBack`. Existing unchanged `reportBack` has matching painted grey geometry; account for its transparent export padding when centring. |
| 2:1153 | PDF background back, 10.79375×18.3333, navy              | Default chat back is smaller. Existing unchanged `memoryBack` supplies this state.                                                                                                |
| 2:1244 | Populated model background more, 14.6667×3.6667, #1A1C1C | Current `chatMore` is16×4/navy. Existing unchanged `reportMore` has the matching painted shape/colour; account for transparent padding.                                           |
| 2:1011 | Attachment background more, 14.6667×3.6667, navy         | Current `chatMore` is16×4. Existing unchanged `more` is the matching original variant.                                                                                            |

`editMemory`/`deleteMemory` include transparent button padding in their original
SVG exports. Their smaller live child-vector bounds alone do not prove a mismatch.
The dynamic photo placeholder2:910 must be replaced by the user's real thumbnail,
not forced onto real photo content. The 27 simulated status vectors belong to
native OS bars; their mock coordinates do not authorize fake time/network/battery.

Remaining: finish all individual vector callsite/paint/opacity/placement records,
including the three direct-vector context IDs (nearest wrapper includes self),
and all earlier/current pair differences. This is not a full artwork approval.
