# Nylo: required design and release review

Read `docs/STATUS.md`, `docs/testing/figma-full-file-audit.md`, and
`docs/adr/0001-figma-coverage-before-implementation.md` before UI work. The owner's
current Figma instructions supersede historical visual acceptance and the older
large-title/jade direction in `docs/QUALITY.md`.

## Before changing Android or iPhone product UI

1. Inspect the entire linked Figma file: every page, frame, descendant, duplicate,
   component/variant, hidden layer, variable/style, asset/font, state and prototype
   interaction. Record provenance and unknowns. A metadata inventory is not a
   completed visual audit. Never mark descendants reviewed solely by ancestry.
2. Maintain `docs/design/figma-coverage.json`: each node needs an explicit review,
   implementation target or reasoned exception, and evidence. Account for screens
   absent from Figma as design-system extensions; never claim an absent reference
   matches exactly. Record every missing requirement and its implementation plan.
3. Run `python3 scripts/verify-figma-coverage.py inventory`. Unknown/unreviewed
   scope blocks this gate. Then obtain an independent **GPT-6 Astra** review of
   the complete audit. The owner requires an honest **10/10 audit-completeness**
   score before implementation. Preserve the report and its digest-bound receipt;
   run the `implementation` phase before editing product code. Do not invent a
   review receipt, coach a score, or seek a higher score without substantive work.

Audit/docs/verifier corrections may proceed while these gates are blocked.
Do not weaken gates to accommodate incomplete evidence. No new native compile
for a test-only change; inspect existing runs before any build/retry.

## Before finalizing or distributing

- Resolve every implementation gap; review all Figma states against **actual
  new native renders at equal logical viewport widths** on both platforms.
  Record image hashes, density, viewport, font scale, real insets, source and
  binary hashes. Keep original PNGs. Do not silently resize or stitch evidence.
- Check artwork, typography/weights, line breaks, spacing, painted bounds,
  fixed controls, shadows/blur, empty/populated/selected/error/keyboard states,
  accessibility text sizes, safe areas and behavior. Retain all three iOS profiles,
  both actual Android navigation modes, gallery/PDF/photo/storage/copy assertions.
- Require a fresh independent rendered-UI review, separate from the inventory
  score. Run `python3 scripts/verify-figma-coverage.py release` and record actual
  evidence/limits. Tests, asset/font hashes, successful builds and a review score
  each prove only their stated scope; none alone proves full visual parity.
- Owner rejection reopens visual acceptance immediately. Preserve old releases,
  narrow prior claims, and hold distribution as a corrected result until reviewed.
  Build/upload/Apple processing/QA availability/installation are distinct facts.

## Workspace and behavior boundaries

Preserve user dashboard scripts in `package.json`, `dashboard/`, and `output/`;
never stage unrelated files. Preserve provider/protocol/key/model/memory/consent,
report opt-in, PDF/storage and background behavior. No extra provider requests,
credential disclosure, signing-key replacement, unrelated Apple roles/testers or
Store15/external17 mutations. Use CI for full native builds, not this 8GB Mac.
Never publish private HANDOFF, Apple receipts, SQL/logs, credentials or Figma auth.
Consult the private handoff when continuing release work. Keep the single owning
continuation and separate four-hour monitor; never create redundant schedulers.
