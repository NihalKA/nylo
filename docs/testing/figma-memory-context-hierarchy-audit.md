# Memory and expanded context: hierarchy audit

Audit in progress, product `dcef4f6` unchanged. Compared fresh original reference
PNGs2:617/2:1050, complete exported node properties and `app/agent/[id].tsx` /
`src/ui.tsx` / `src/agent-context.ts`. This is a source/reference audit, not a
corrected native result. The110 Memory and89 Context node records now retain individual source/reference dispositions; five Context date/action contract records remain unreviewed.

## Structural gap in expanded Shared Context

Figma2:1050 is a distinct expanded presentation: native status area,56px navigation
header,52px date/context-action row with bottom divider, then scroll content with
20px top/24px sides. The body begins **Current goal**, followed by28px separation
before **Context between chats**, its switch/disclosure/Hide action/preview, then
the delete-agent danger zone. The preview has no memory editor or profile above it.

The current `showContext` branch changes the header size/icons, hides bottom tabs
and appends a preview, but retains the profile, New conversation CTA, segmented
tabs, New memory editor/Save action and Saved memories before Current goal. It
does not render the reference date/action subheader2:1070–1078. This is a real
hierarchy mismatch, beyond line heights or different user data. Existing normal
memory-state proof cannot establish this expanded view's visual correctness.

The retained dcef native context images were reopened and visually inspected:

- Android gesture gallery `gallery-08-shared-context.png`,1080×2400,
  SHA256 `5cac83c8f87d3db7fb420174a9932af397c3e6a0f01ea617432c264995073df8`.
  The capture visibly includes the memory editor/Save/Saved memories above the
  goal, and has no date/action subheader under Agent.
- iOS gallery `gallery-11-agent-shared-context.png`,1320×2868,
  SHA256 `9a2550f6331210b0e94fdb0cc66571ceb9cc9769b34a126e0877a9750304bfdc`.
  It is scrolled farther down, showing Goal and the full context card; the fixed
  date/action subheader is absent. Different scroll positions do not make these
  hierarchy states equivalent. These are retained prior-source captures at their
  original viewport sizes, **not** new390dp comparison or corrected-release proof.

Required implementation plan after audit approval: make expanded context a
distinct presentation using the same existing state/data functions. Start with
the reference header/subheader and goal/context ordering; return cleanly to the
memory view on Hide/back, preserving drafts, memory edits and scroll/keyboard
access. Do not keep unrelated editor sections above the expanded preview merely
because they share a route. Show an actual agent/context date, never the mock date.

The reference names the subheader actions **Edit agent info** and **Delete recent
items**; it stores no prototype binding or deletion contract. The edit destination
can map to the existing agent editor. The scope of the second action is **not yet
resolved**: it must not be silently wired to deleting the agent, all conversations
or memories, or fabricated as a no-op. Record a reviewed explicit behavior/exception
before implementation. No destructive data mutation is authorized by this audit.

## Source/reference geometry and paint differences

| Nodes       | Fresh reference                                                                                                                                     | Source observation / required plan                                                                                                                                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2:636       | Collapsed Agent title Jakarta70018/24                                                                                                               | Shared Header defaults28 leading; only size/weight/tracking overridden. Set state-specific24 leading. Expanded2:1067 is22/28.                                                                                                                                                                                   |
| 2:642–651   | Profile avatar48; text begins14px after avatar; name18/22.5, description14/20,2px gap                                                               | Source uses16 horizontal/7 vertical gap, implicit name leading and description21. Reference description125.14px wide/60px tall overflows its44.5px wrapper; retain the **full** real description and grow the summary instead of copying its clipped third line.                                                |
| 2:643–644   | Avatar48, Jakarta70018/24, white glyph, inner shadow0,2,4 black5%                                                                                   | Source avatar48 and family/weight/size/white match; leading and inner shadow are missing. Real initial/colour replace mockW/green.                                                                                                                                                                              |
| 2:659–663   | Outer segment48; selected paint167×38 atx170/y5, border20%, shadow0,1,2 black5%; labels14/20                                                        | Source outer48 is already correct. Its50/50 flex hits and2px selected-side inset produce different painted edges; selected shadow and explicit label20 leading are missing. Measure centres/insets rather than enlarging the segment.                                                                           |
| 2:664–676   | New memory section:4px top,8px internal gaps; label24; textarea110.25 (16px top/24px bottom), shadow0,1,2 black5%; Save46                           | Source shared Field gap7, outer memory column gap16 and textarea13px vertical padding/min110; no textarea shadow. Group this section deliberately; retain min44+Save and keyboard/dynamic growth.                                                                                                               |
| 2:677–688   | Saved section8px top/internal gaps; card text/date gap4, date60011/14                                                                               | Source uniform16px gaps, heading marginTop8, date marginTop6/400/implicit21. Scope date weight/leading and local4px gap independently.                                                                                                                                                                          |
| 2:682–694   | Memory card92 minimum/radius16,16 padding/border40%, two shadows; reference text/action gap12                                                       | Card paints/two shadows match source; text/action gap is8. Source88px action hits plus4 gap are wider than the mock64.333 content. Keep44pt hits and document the resulting text-width/reflow exception; do not shrink actions to mock31/29px hits.                                                             |
| 2:695–705   | Collapsed context section:1px top border,12px top/internal gaps; heading16/24; label14/20; disclosure12/19.5                                        | Source border/title padding13 represents top border plus12; remaining uniform16 gaps and label24/disclosure18 differ. Switch44pt hit instead of mock36px row is a narrow accessibility exception.                                                                                                               |
| 2:702–703   | Collapsed enabled track48×28 green059669, white thumb24 atx26/y2; track inner shadow                                                                | Source track colour/size match, thumb left22 and no inner shadow. Reference thumb protrudes2px beyond track; do not misreport source geometry as exact. Decide and record the specific painted-bound treatment during reviewed plan/native validation.                                                          |
| 2:1080–1085 | Goal: heading18/24,8px gap, field54/16 padding, body14/20, shadow0,1,2 black5%                                                                      | Source gap6, heading implicit leading, body inherits24 and shadow absent. Real goal remains optional; never inject mock goal text.                                                                                                                                                                              |
| 2:1093–1098 | Expanded switch48×28 green22C55E with28 blue2563EB knob and unchanged24px checkSVG                                                                  | Source expanded colours/knob/check binding match. Preserve existing consent/default OFF and disabled-during-send behavior; reference checked state is not permission to enable sharing.                                                                                                                         |
| 2:1104      | Preview white/radius12/border1, padding16, shadow0,1,2 black5%                                                                                      | Current shared s.card uses navy0,2,6/5% and elevation1. This preview needs its own measured surface role.                                                                                                                                                                                                       |
| 2:1105–1132 | Header label11/14;6px header-to-body; nested role14/20; assistant blocks6px apart; callout12/16 with4px internal gap; secondary12/16; dividerE8E8E7 | Source label leading implicit, uniform8px gaps, callout/secondary18 leading, borderC6C5D0 at30/40%, marginLeft2/paddingLeft12 versus reference14px padding+2 border. Group borders between sections, not a bottom border on the preceding section. Keep all actual excerpt text and inline role/emphasis spans. |
| 2:1133–1136 | Danger zone28 top margin +24 top/16 bottom, centred red14/20 label in36px painted control                                                           | Source marginTop40/full-width48+ button, no measured section grouping. Retain44pt hit and actual delete-agent confirmation; adjust painted spacing separately.                                                                                                                                                  |

The dropped avatar-description line in the mock, larger action hits, actual safe
areas and real data need explicit exceptions. They do not excuse missing subheaders,
incorrect ordering, borders, section spacing or distinct state typography.

No new source/UI build is authorized yet. Full-node and state audit, action-scope
resolution and independent Astra completeness review remain outstanding.

The timeline dots also need state-aware vertical alignment: the first28px-high
wrapped label centres its6px dot at11px, while the later14px label uses4px.
Source pins both to5px. Match the actual wrapped label height, not fake two-line
copy or a fixed offset that only works for one title.
