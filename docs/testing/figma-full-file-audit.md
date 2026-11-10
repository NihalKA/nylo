# Whole-file Figma coverage — reopened audit

Status: **historical file-specific audit; coverage remains incomplete**. The
owner accepted the feature candidate and merged PR #2, then replaced the universal
freeze with the link-specific adoption policy in `AGENTS.md`. The findings and
phase requirements below describe this earlier audit, not a global merge gate.
They are retained honestly; no complete visual-parity review is claimed. Builds
20 and 21 are now available to the existing internal TestFlight group.

Reference: https://www.figma.com/design/WNCRguvh0wqYTgBUlbXZ9G/Untitled

## Evidence and scope

Live browser access was recovered with a fresh signed-in tab. The current file was
saved through Figma's normal **Save local copy** on10 November at11:51:26UTC;
all14 original1x PNGs were exported at11:56:10UTC. The complete file archive and
PNG archive pass SHA/ZIP CRC checks. Source identity, original image hashes and
privacy-filtered node facts are in `../design/figma-live-source.json` and
`../design/figma-live-node-facts.json.gz`. These are fresh reference inputs, not
native implementation acceptance. No account/seat upgrade or quota bypass occurred.

The full exported file contains **1,325 records**, reconciling all1,322 original MCP
metadata IDs plus document0:0, an empty hidden internal canvas0:2 and visible
vector2:1098 inside toggle thumb2:1097. There is one visible page with14 frames,
not two user-facing design pages. The decoder uses the embedded schema and pinned
kiwi-schema0.5.0; raw plugin/editor/session data stays ignored/private. Render facts
retain every record's hierarchy, geometry, fonts, text/overrides, paints, effects,
constraints and vector-blob hashes. The original14 PNGs are retained unchanged.

All nine current PNGs and the three earlier variants with minor pixel differences
were visually inspected; Create/Files earlier variants are pixel-identical to their
inspected current counterparts. Do not describe all five pairs as pixel-identical.
In the exported file there are no saved component/instance/variant, variable/named
style or prototype/transition/hyperlink records. Inline style and text overrides
are present and retained. Unused account-wide library subscriptions were not queried;
this is a statement about the actual file's used content, not account-wide absence.

Official MCP authenticated and supplied nine current contexts/screenshots on
10 November. Starter-plan tool quota is now exhausted; this is not an auth failure.
Normal signed-in Figma viewing works. Earlier full14 SVG exports are dated
9 November 20:29:38.685Z and must not be represented as newly exported styles.
The earlier MCP metadata inventories Page1 `0:1`,14 frames and1,322 nodes; the fresh complete export adds the three records above. Normal page
list shows one page. The tracked metadata snapshot is design hierarchy/bounds
only; it contains no auth URLs or credentials. Duplicate mapping finds491 pairs
with matching type/name/relative geometry, not full style/interaction equivalence.

| Current frame         | Earlier frame | Required follow-up                                                  |
| --------------------- | ------------- | ------------------------------------------------------------------- |
| Settings 2:494        | 1:2           | 205.14px detail column/two-line wrap, row and section rhythm        |
| Memory 2:617          | 1:125         | 2px profile gap,22.5/20 line metrics,48px segment,8px action rhythm |
| Create 2:727          | 1:235         | Role600 weight, field gaps8/4, painted role bounds with44pt hits    |
| Report 2:814          | 1:322         | Action cluster12px top/16px gaps; preserve optional excerpt OFF     |
| Files 2:896           | 1:404         | 32px neutral plus disc and8px greeting gap; actual thumbnails       |
| Attachment 2:986      | —             | Handle/header/actions/helper/safe-bottom measured at390dp           |
| Shared context 2:1050 | —             | Grouped type/timeline/text flow and memory spacing                  |
| PDF 2:1139            | —             | Row geometry/search/footer; retain honest capability guidance       |
| Model 2:1234          | —             | Header/search/groups/rows; avoid arbitrary sheet-height increase    |

All metadata and newly discovered file records are listed in `../design/figma-coverage.json`; **enumerated is
not reviewed**. Initial pending entries intentionally block inventory approval.
Complete each with exact target/exception and retained context/image/layout evidence.
Do not bulk-mark descendants from the screen-level inspection above.

The fresh complete export now accounts for hidden/internal records and contains no
stored reusable-component/variable/style/prototype interactions, as qualified above.
Per-node source dispositions, vector/asset callsites, responsive geometry, app-wide
extension rules and state coverage remain unfinished. Fresh acquisition and absence
of stored interaction records do not automatically approve those reviews.

The Settings screen now has123 explicit node dispositions in
`../design/figma-settings-node-audit.json`, including actual source gaps, matching
artwork and narrow OS/hit-target exceptions. Its source states and seven audit
checklists are recorded; this is inventory progress, not native visual acceptance.
The complete recursive font inventory accounts for251 text nodes and262 font-name
occurrences including inline overrides:11 design faces map to the12 available
runtime faces. See `../design/figma-font-audit.json`. Three missing original state
SVGs are acquired and hash-bound; [the artwork audit](figma-artwork-state-audit.md)
records their exact painted bounds and remaining callsite checks. **770 of1,325
node dispositions remain unreviewed.** No Astra completeness approval exists.

Chats inbox, Agents landing, provider editor and live-check have no standalone frame
in the visible inventory. Record app-wide flows as extensions, map shared design
rules and justify every state instead of claiming a fictional exact reference.

## Required gates

Run from repository root (Python standard library only):

```
python3 scripts/verify-figma-coverage.py inventory
python3 scripts/verify-figma-coverage.py implementation
python3 scripts/verify-figma-coverage.py release
python3 scripts/verify-figma-coverage.py changes --base-ref <full-pre-change-SHA>
python3 -m unittest discover -s tests -p 'test_figma_coverage.py'
```

Inventory requires exact XML node coverage, all14 frame checklists, complete domain
accounting, evidence hashes and plans for every known gap. Implementation additionally
requires a real independent GPT-6 Astra10/10 completeness receipt bound to the audit
inputs. Release additionally requires resolved gaps, new native evidence and separate
independent rendered-UI approval bound to the final product fingerprint. Reviews are
separate JSON receipts with report path/hash; never generate an approval automatically.

Every node needs `status` (mapped/exception/duplicate), `target`, `rationale`, and
`evidence` paths into the manifest's hash-bound evidence table. Duplicate entries
also name their exact current node and must carry their own review rationale.
Frame checklists cover geometry, typography, artwork, colours/effects, content,
states/actions, responsive/accessibility behavior. Domains use observed/not-present,
with rationale/evidence, never unsupported assumptions. Gaps use planned/resolved;
each needs affected nodes, implementation plan, evidence and target. Extensions
need scope, rules, states and approval evidence. See verifier for exact schema.

Each release comparison records original native/reference hashes, source fingerprint,
platform, logical width390, pixel width/density, font scale, real safe insets and
review findings. Export shadows/mock phone extents are explicitly excluded using
documented content bounds; preserve original images. Native bars,44pt targets,
dynamic text, consent/real data require narrow exceptions, not general parity waivers.

The verifier cannot authenticate an author or judge image quality. Its integrity
checks support a real independent review and do not replace it. Do not confuse
passing verifier unit tests with a passing design gate. Current gates should fail.

## Schema2: discovered scope and release evidence

`docs/design/figma-discovered-scope.json` is a separate discovered-item inventory,
hash-bound by the manifest. Each domain has `enumerationComplete` and `items`
(unique IDs). The manifest needs a reviewed disposition for every discovered item.
`extraNodes` adds nodes discovered outside the baseline XML, explicitly classifying
page/parent and whether each is a screen; discovered screens also require state
obligations. They cannot be silently dropped. `extensionIds` includes Chats/Agents/provider/live-check/font-licenses/app-shell scopes.
`scopes` lists every screen/extension and every required state; enumeration stays
false until actually audited. The enforced conservative state floor is reference, empty,
populated, selected, error and keyboard; inapplicable cases retain those state IDs
with a narrow reviewed exception, never silent omission. Additional discovered states must be added.

`releaseObligations` contains one unique `platform|scope|state` ID per combination.
Each binds a capture requirement or evidence-backed exception into the inventory
review. Release comparisons cover every obligation exactly once. A capture cannot
be downgraded to an exception after inventory approval.

Each evidence-table entry has `kind`, repository-relative `path`, SHA256 and
provenance. Original native/reference PNGs have distinct kinds. PNG chunks, CRC,
scanline data and actual dimensions are checked. Comparison `density`,390 logical
width, pixel bounds and logical safe insets must be numeric and consistent with the
original files. `referenceDensity`/`referenceContentBounds` explicitly account for
export shadows/scaling; they never replace the original image. Noninterlaced8-bit RGB/RGBA PNG with supported standard screenshot chunks
is required; palette/grayscale/APNG and unsupported chunks are rejected explicitly; convert neither evidence nor density merely to obtain a pass.

`binaries` identifies each tested native artifact using `artifactEvidence` of kind
`binary-artifact`, a full Git `sourceCommit`, `productFingerprint`, platform,
`buildId` and numeric CI `runId`. A `binary-identity-receipt` must bind those fields
to the actual artifact SHA and compiled audit checks (identity/fonts12/SVG45/
privacy/archive, plus Android original certificate/bundletool or iOS linked identity).
The verifier checks ZIP CRC, artifact bytes and the committed source fingerprint.
These receipts summarize actual retained audits; they must never be invented.

A comparison names its `binary`, `sessionEvidence` and `captureId`. The typed
`native-capture-session` JSON binds the binary SHA/source/build/run and an
`originalCaptures` declaration. Its captures index binds each ID to `imageEvidence`,
SHA, scope/state, density, pixel width, logical width, font scale, safe insets and
content bounds. This detects changed identities/configuration; it does not by
itself prove that an image was captured truthfully or was never manipulated.

`functionalProofs` has separate compact/large/max iOS, two Android modes, iOS
gallery/PDF/photo and both Android galleries. Each binds actual JUnit, executed
command receipt, Git fixture manifest, binary and explicit configuration. Required
behavioral assertions (draft/memory/navigation, exact293copy, SQL/blob, protocol,
photo/recovery/EXIF as applicable) need passed evidence from native logs/receipts.
An eligibility-only run or all-skipped JUnit cannot pass. No simulated receipt
generation is authorized; synthetic fixtures exist only in unit-test tempdirs.

The rendered review receipt requires `releaseDigest`, covering comparison records,
the evidence-table hashes/provenance, binary records, functional proofs and gap
resolutions/evidence. The inventory receipt requires `auditDigest`; it excludes
later resolution progress but binds original plans and scope. Both require model
`gpt-6-astra`, independent=true, honest score10, approved decision, no unresolved
findings, review date and an actual report path/SHA. The rendered receipt also
binds the final product fingerprint. Policy/audit changes require fresh review.

The product fingerprint includes tracked Android/iOS native sources, native build
scripts/workflows, fastlane/Gemfile
locks, app configuration, dependencies and package lifecycle/app scripts, excluding
only the owner's two dashboard package scripts. Unknown script/workflow helpers
are conservatively build-affecting; the three review-gate helpers and known source
checks/site workflows are explicitly separate. Test fixtures have a separate fingerprint.
Source CI tests the gate and enforces authorization on the pre-change Git snapshot;
it does not claim branch protection, visual correctness or authenticated authorship.

Git-index/nonignored inputs distinguish tracked native source from ignored generated
Android/iOS projects. A directory named build inside src is not excluded. Committed
archive fingerprints include every build-affecting tracked path. Do not hide source
in generated paths or treat a passing source job as rendered acceptance.

Read sanitized full-file facts with Python standard library:

```
python3 -c "import gzip,json; d=json.load(gzip.open('docs/design/figma-live-node-facts.json.gz')); print(d['nodes']['2:873'])"
```

Do not modify reference PNGs to satisfy geometry checks. Each node must still have
an actual review disposition; enumerating the fresh file does not mark it reviewed.
