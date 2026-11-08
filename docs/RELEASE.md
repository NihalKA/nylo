# iOS release runbook

Target: iPhone, registered bundle ID `com.nylohq.nylo`. App Store record: https://appstoreconnect.apple.com/apps/6832224555. Signing is configured. Signed **0.1.0 (10)** (app source 6470912) uploaded through run 42497581610 and Apple processing is VALID, build ID `8099fcdf-ad35-4d66-a200-9e270507c3f0`. Gallery 42499737557 passed. Build 10 is assigned to internal Nylo Device QA; assignment and test notes verified. Build 8 remains available as the older design. Independent review 016 recommends the feedback beta at 85/100, with accessibility/owner/physical/live gates open. No production approval. Android publication is deferred.

Full native run 42497575404 and all three profiles of fresh-native smoke 42498930753 passed at 6470912 with no JS refresh. Earlier refreshed smoke 42497578413 also passed all profiles. Exact source/native provenance and synthetic versus live evidence remain separate.
App Store Connect was rechecked on 8 November 2026: version 1.0 remains PREPARE_FOR_SUBMISSION with saved English metadata and privacy/support URLs. Current source marketing version is still 0.1.0; align it before building the final 1.0 candidate. The age rating is unset. No submission or production release has occurred.

## Native evidence without local compilation

`iOS native validation` on GitHub builds a Release simulator app, installs/launches it and captures the Chats screen. Download the matching commit's artifact and review the actual screenshot. This proves neither signed device installation nor full interaction/accessibility. Add native flow screenshots and physical-device evidence before release.

The connected iPad A16 is now paired, connected and has Developer Mode enabled, but current T3 device discovery exposes only the simulator. Local simulator accessibility navigation succeeded; screenshot capture failed twice after the recommended refresh, so interaction stopped. These tool limitations leave physical testing and VoiceOver unverified. See STATUS.md for the current evidence runs and testing/native-privacy-manifests.md for the preliminary native dependency audit.

For JavaScript-only UI iteration, manually dispatch `iPhone UI smoke` with a successful native `source_run_id` and `refresh_js_bundle=true`. The script refuses changes to package manifests/lockfile, Expo configuration or icon assets, then embeds current JS/Hermes bytecode into the seed simulator runtime. Provenance records both commits. This is simulator UI evidence only; final TestFlight/App Store candidates still require a fresh signed build. Profiles cover compact iPhone, Pro Max and maximum accessibility text. Tests use synthetic local drafts/memory and no live keys. Automation currently prefers the previously working installed iOS 26.2 runtime; newer runtime compatibility is a separate check. Launch screenshots and Maestro diagnostics are retained even if the test driver cannot start.

## Signing and TestFlight

Use the `apple-release` GitHub environment with deployment limited to main. No secrets in PR workflows. Set the following through secure input/GitHub encrypted secrets, never source files:

- ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8_BASE64: an appropriately scoped App Store Connect API key.
- APPLE_TEAM_ID: actual enrolled publisher team.
- IOS_CERT_P12_BASE64 and IOS_CERT_PASSWORD: exportable distribution certificate plus its private key.
- IOS_PROFILE_BASE64: matching App Store distribution profile for this app/team/certificate.
- CI_KEYCHAIN_PASSWORD: random per-project CI keychain password; never reused as an account password.

Create app record, confirm package/name availability and roles, back up credentials privately, and enable API access. Provisioning profile and certificate expiry are release dependencies. Do not revoke certificates used by other apps. Upload permissions do not necessarily include certificate creation.

Trigger `iOS signed beta` on main. It checks source, uses ephemeral signing files/keychain, builds and uploads to TestFlight. Runs 42475045265 and 42476376051 verified the lane. CI build numbers must increase; if migrating an existing app with higher build numbers set an offset before first upload. Keep a single beta numbering workflow and do not reset its run counter after releases.

## Production gates

- Independent review thresholds in QUALITY.md, including real rendered screenshots.
- First successful native provider use, persistence/recovery and physical iPhone pass.
- Published privacy/support pages and reachable support contact.
- Correct privacy/age/encryption declarations, publisher details and App Review access.
- No known high/critical issues; tested build commit and binary are identified.

`fastlane ios submit` requires NYLO_RELEASE_READY=true, IOS_MARKETING_VERSION and IOS_REVIEW_BUILD_NUMBER. This is a guard, not self-certifying evidence. The agent must verify and record the evidence before enabling it. Submission references the exact tested TestFlight build; metadata/screenshots and required console declarations must already be complete. Initial implementation has no automatic production workflow until evidence and account setup are complete. User authorization for eventual submission/release is already given; no routine reapproval required.

## External account actions

Apple sign-in/2FA and contracts belong to the account holder. Prefer browser authentication for account inspection, then a restricted API key for deterministic automation. Never share account passwords or verification codes in chat. If secret input is needed, the agent opens a private credential card. GitHub Actions uploads are not synonymous with TestFlight processing, App Review acceptance or store publication.

## Recovery

Preserve last known-good source and backups. Stop affected releases, fix forward with a new build/version and rerun relevant tests. App Store binaries cannot be instantly rolled back for existing installs. A release that changes native code or data schema needs native tests; do not use OTA updates to bypass review.
