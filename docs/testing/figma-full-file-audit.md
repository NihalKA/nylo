# Whole-file Figma coverage — reopened audit

Status: **incomplete; implementation and corrected delivery blocked**. Product
`dcef4f6` / public Android13 remains available as the prior candidate. Signed20
workflow42798741091 succeeded, but it is held from corrected QA distribution.
The owner's visual rejection supersedes historical acceptance elsewhere in docs.

Reference: https://www.figma.com/design/WNCRguvh0wqYTgBUlbXZ9G/Untitled

## Evidence and scope

Official MCP authenticated and supplied nine current contexts/screenshots on
10 November. Starter-plan tool quota is now exhausted; this is not an auth failure.
Normal signed-in Figma viewing works. Earlier full14 SVG exports are dated
9 November 20:29:38.685Z and must not be represented as newly exported styles.
Fresh page metadata inventories Page1 `0:1`, 14 frames and 1,322 nodes. Normal page
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

All metadata nodes are listed in `../design/figma-coverage.json`; **enumerated is
not reviewed**. Initial pending entries intentionally block inventory approval.
Complete each with exact target/exception and retained context/image/layout evidence.
Do not bulk-mark descendants from the screen-level inspection above.

Unresolved whole-file domains: hidden layers, components/variants/library links,
variables/styles, all prototype hotspots/transitions and state completeness. Normal
Present opens a prototype with1/14 frames; that proves presentation exists, not
that there are no interactions. Missing metadata node types do not close these gaps.
Account for every domain explicitly, including an evidenced absence when applicable.

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
obligations. They cannot be silently dropped. `extensionIds` includes the known Chats/Agents/provider/live-check scopes.
`scopes` lists every screen/extension and every required state; enumeration stays
false until actually audited. Conservative initial states are reference, empty,
populated, selected, error and keyboard; inapplicable cases require a narrow reviewed
exception, not silent omission. Additional discovered states must be added.

`releaseObligations` contains one unique `platform|scope|state` ID per combination.
Each binds a capture requirement or evidence-backed exception into the inventory
review. Release comparisons cover every obligation exactly once. A capture cannot
be downgraded to an exception after inventory approval.

Each evidence-table entry has `kind`, repository-relative `path`, SHA256 and
provenance. Original native/reference PNGs have distinct kinds. PNG chunks, CRC,
scanline data and actual dimensions are checked. Comparison `density`,390 logical
width, pixel bounds and logical safe insets must be numeric and consistent with the
original files. `referenceDensity`/`referenceContentBounds` explicitly account for
export shadows/scaling; they never replace the original image. Noninterlaced PNG
is required; convert neither evidence nor density merely to obtain a pass.

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

The product fingerprint includes native build scripts/workflows, fastlane/Gemfile
locks, app configuration, dependencies and package lifecycle/app scripts, excluding
only the owner's two dashboard package scripts. Unknown script/workflow helpers
are conservatively build-affecting; the three review-gate helpers and known source
checks/site workflows are explicitly separate. Test fixtures have a separate fingerprint.
Source CI tests the gate and enforces authorization on the pre-change Git snapshot;
it does not claim branch protection, visual correctness or authenticated authorship.
