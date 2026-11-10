# ADR 0001: complete design coverage before implementation and release

Date: 2026-11-10. Status: superseded as a repository-wide policy by the owner's
link-specific instructions in `AGENTS.md`.

## Superseding owner decision

After accepting and merging PR #2, the owner clarified that the fixed audit gate
was for that particular Figma file. Future supplied links require complete design
adoption and verification, without imposing the old file's inventory or scored
review receipts on every product change. Source CI no longer runs that legacy
pre-change authorization check. Normal source and functional checks remain.

The original decision and findings below are retained as historical evidence, not
current universal merge requirements. No incomplete audit is relabeled complete.

## Context and mistakes

The owner rejected Android13's visual match after earlier deliveries were called
complete. Android13 is a different, verified binary; correct download identity did
not resolve the reported design problem. We overclaimed completeness from native
functional tests, selected capture inspection, font/artwork hashes and token checks.
Those checks remain useful within their scope, but did not establish every layout,
state or screen. Prior acceptance is withdrawn for visual parity.

We concentrated on nine current frames without an auditable disposition for the
whole file. Five earlier frames, descendant-level coverage, hidden layers,
components/variants and prototype behavior were not all explicitly accounted for.
The retained page inventory has 1,322 nodes and 14 top-level frames; 491 earlier to
current pairs agree on type/name/relative geometry. That does not prove identical
styles, interactions or hidden content. Metadata omitting a category does not prove
that the category is absent from the file.

We also failed to distinguish supplied screens from app screens with no standalone
reference (including Chats and Agents landing). Their existing large headings and
generic cards remained substantially unchanged. Any redesign must be labeled a
design-system extension with explicit review, not an exact match to an absent frame.

Measured follow-up found real discrepancies: Settings description wrapping can
collapse its intended two-line column at 411dp; memory/form label gaps and weights
differ; report actions use unrelated form spacing; Add file lacks the neutral plus
disc. These are audit findings awaiting the owner's required review, not fixes
already delivered. Comparing unequal viewport widths or shadow/export bounds can
hide or manufacture such differences. Accessibility/privacy/native-safe-area
exceptions need specific evidence and rationale, never blanket approval.

## Decision

Use three fail-closed phases, documented in the full-file audit:

1. Inventory: exact node set and per-node dispositions, all file-wide domains,
   references, findings and plans. Unknown/unreviewed coverage fails. Known product
   gaps are allowed only when individually mapped and planned.
2. Implementation: inventory passes and independent GPT-6 Astra has honestly
   rated the complete audit 10/10, bound to the reviewed inputs. Only then edit UI.
3. Release: every required gap resolved, exact source/binary/native-render evidence,
   same-logical-width comparisons, intentional exceptions and a new independent
   rendered-UI approval. Inventory approval never implies delivered UI approval.

The verifier checks structure, exact coverage and hashes. It cannot prove truthful
human/model observations or authenticate who authored a receipt. Reports must come
from real independent review; the owning agent must not fabricate them. Evidence
updates invalidate bound reviews. Missing evidence fails rather than silently skips.
CI tests verifier behavior; a passing source-check job is not visual acceptance.

## Consequences and prevention

Root `AGENTS.md` makes this review mandatory before coding and finalization. A
tracked manifest preserves incomplete items honestly. The current manifest starts
unreviewed where review has not been completed; the verifier must fail until the
work is done. Historical 95/100 quality guidance is distinct from this owner's
10/10 audit-completeness requirement. Reopened owner feedback blocks corrected
distribution regardless of previous scores. Existing releases and failure evidence
remain intact; do not rebuild unchanged binaries or weaken functional assertions.

Before future sign-off, verify source and delivered binary identity, complete
design inventory, equal-width rendered comparisons, all states and documented
exceptions separately. Report build, upload, availability and installation precisely.

## Independent safeguards review and correction

[Astra's safeguards review](../reviews/022-figma-safeguards.md) found seven real
contract gaps in the first verifier: mutable release evidence, unvalidated image
geometry/binary identity, missing state/extension obligations, omitted native build
inputs, incomplete discovered-domain reconciliation, procedural-only CI freeze and
contradictory historical wording. No audit score or approval was given.

Schema2 separates inventory approval from a full release-evidence digest, checks
original PNG bytes and capture-session/binary/source/configuration binding, and
requires a discovered screen/state matrix plus explicit native functional profiles.
CI evaluates product authorization against the pre-change checkout. Known extensions
cannot disappear from scope, and additional discovered items require dispositions.
These integrity checks still cannot authenticate an author or replace actual
independent visual review. Regression tests use synthetic temporary fixtures only.
