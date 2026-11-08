# iOS release runbook

Target: iPhone, registered bundle ID `com.nylohq.nylo`. App Store record: https://appstoreconnect.apple.com/apps/6832224555. Team, bundle identifier, app record and signing credentials are configured. Signed builds 3 and 4 uploaded and Apple processing is VALID; build 4 is assigned to internal device QA. Android publication is deferred.

## Native evidence without local compilation

`iOS native validation` on GitHub builds a Release simulator app, installs/launches it and captures the Chats screen. Download the matching commit's artifact and review the actual screenshot. This proves neither signed device installation nor full interaction/accessibility. Add native flow screenshots and physical-device evidence before release.

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
