# Vivek UI 2.1 internal iOS preview

Owner requested the UI from `ui-update/2.1` commit `1a4444fb1812ad6968cbf5dee19c050de7c79671`, including its removed bottom tabs. This preview retains that UI. The moved screens required relative import fixes, the root stack entry changed to `index`, and existing detail navigation references were updated to the new routes. No replacement navigation was added. Agents and Settings have no entry point from the home screen in this preview.

Signed source `ace016ea5bebd2a49da01fcf52e0d69fa5751c41` produced **1.0.0 (41)** through [CI run 43438254047](https://github.com/NihalKA/nylo/actions/runs/43438254047). Type checking, 162 tests, security checks, original asset/font checks and an iOS Hermes export passed. CI verified the actual IPA source marker, 45 SVGs, 12 runtime fonts, signing certificate, provisioning profile, signature and privacy manifests before upload.

Apple processing is VALID. Exact internal Nylo Device QA assignment, IN_BETA_TESTING state, English test notes, unchanged tester membership and preserved prior build selections were independently verified on November 13, 2026. Physical installation and visual/native interaction testing are unverified. This is an owner-requested UI preview, not a complete design adoption claim. No external distribution, App Store submission or merge was performed.

The temporary CI branch permission was removed after upload. Workflow branch allowance is removed in this documentation/cleanup commit; application inputs remain identical to the signed source. Original audit receipts remain private.
