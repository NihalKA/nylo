# iOS release

## AI SDK mobile beta delivered — 1.0.0 (27), 12 November 2026

Build **1.0.0 (27)** is available to the existing internal **Nylo Device QA**
group. Apple processing is VALID; exact group membership, IN_BETA_TESTING and
English beta notes were independently read back. Actual installation is unverified.

Both iOS and Android binaries use source `199e62fa7670706ebedcf5ca8dbbc9439aae80a4`.
The feature stays on `feat/ai-sdk-mobile-capabilities` in
[unmerged PR #6](https://github.com/NihalKA/nylo/pull/6). Signed iOS workflow
`43114738391` and Android `43114732905` pass actual source/signing/privacy/package
audits. iOS SDK and all three smoke profiles pass with 48 captures inspected;
Android SDK/smoke pass both navigation modes with 36 captures inspected. The
source suite has 105 passing tests; both-platform Hermes exports pass.

[Download Android APK 27](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-27/Nylo-test.apk).
Its public download and published checksum match the audited binary. No Play
release occurred. TestFlight build/upload/processing/group availability are
verified separately; physical installation and live mobile provider use remain
unverified. Native SDK checks use synthetic data; a computer SDK integration
verified the selected connection's image generation and web source output.

The temporary feature signing-environment exception was removed, preserving both
existing policies. Store15/external17, unrelated testers/roles/signing and the
separate App Review monitor were not changed. The owning delivery continuation
is disabled after confirmed delivery. Full receipts and limitations:
[AI SDK mobile verification](testing/ai-sdk-mobile-capabilities.md).

## Internal background-response beta delivered — 1.0.0 (17)

Build **1.0.0 (17)** is delivered to the existing internal Nylo Device QA group. Signed workflow 42612628652, source e452a2d produced the actually audited IPA; Apple build `4e6626be-2598-4c2e-a7ae-72e9b628ff51` is VALID. Assignment returned 204 and independent group/buildBetaDetail reads verify exact17 and IN_BETA_TESTING; notes were saved/read back and owner access preserved. Actual audit verifies version, build, bundle, iPhone family 1, eleven manifests, required SDK declaration, camera purpose, no microphone or tracking, and exempt encryption. Proof: `artifacts/signed-17-audit/qa-assignment-verification.json`.

This update adds Responses defaults for new custom connections and finite UIKit background completion for an already-started iPhone response. Existing credentials/protocols are unchanged. Fresh native, all three smoke profiles and the complete owned-localhost background/memory/Stop/restart sequence are inspected and pass across the recorded runs; see STATUS.md and testing/background-responses.md. Physical/VoiceOver/live-provider/grant-expiration and remaining craft limits are disclosed, not certified by these simulator results.

Android test APK and signed AAB are also delivered, without Play purchase/upload. The 30-minute delivery continuation is disabled. Store **1.0.0 (15)** remains selected and WAITING_FOR_REVIEW with AFTER_APPROVAL, independently read back12:17 UTC; **17 was not associated with the store version.** Following the owner’s additional request, it is now assigned to external QA, but Apple blocks its beta-review submission until build15’s existing beta review completes. No invitation email is claimed sent. The separate App Review/external-tester invitation monitor remains enabled.

## PDF follow-up delivered — TestFlight 1.0.0 (16)

Build **1.0.0 (16)** is now available to the existing internal Nylo Device QA group. Apple build `4f12d3b2-fe6f-45a6-98a0-ddf62c7e6b41` is VALID; assignment returned 204 and independent group/build-state reads verify the exact build and IN_BETA_TESTING. English test notes were saved/read back. Signed workflow42579991019 uses HEADa1a12d6/appa02f88e; the actual exported-archive audit confirms version1.0.0/build16/bundle/iPhonefamily1/11manifests/requiredSDKpresent/camera/noMic/noTracking/exempt encryption. Proof: ignored `artifacts/signed-16-audit/qa-assignment-verification.json`.

The PDF card and warning are smaller; the model picker offers direct editing of the selected provider's API format. Opening/backing out sends nothing and preserves the saved connection and draft. A format change still requires explicit save and key re-entry; actual PDF support depends on the provider/model. Update via TestFlight to try build16.

PDF42576100714 passes58commands. Fresh native42576088809 and automatic42577980036 pass all3profiles (compact96/large with 94/maxtext102completed, each11conditional skips). Fresh-native gallery42580144030 passes183/183, exact293-byte clipboard equality and nativeSQL/blob checks; recorded native/JSa02 with refreshfalse and fixture6a3964e hashes match. All17 current gallery checkpoints plus launch were inspected, including a full rendered restored image and exact draft. This supplies the missing rendered evidence from the earlier blank capture; its cause remains unproven. Evidence: `artifacts/pdf-polish-a02/fresh-gallery/verification.json`.

No provider calls, physical/VoiceOver validation or new numerical score are claimed. The latest independent88/100 assessment and existing physical/live/resource gaps remain. **Submitted storebuild15 is still WAITING_FOR_REVIEW and remains associated with the store version; build16 was distributed internally only.** The 30-minute PDF continuation is disabled after verified delivery. The separate4-hour Apple review/external-tester invitation follow-up remains active.

## App Store submission verified — 9 November 2026

**Version 1.0.0 (15) is submitted and WAITING_FOR_REVIEW.** Apple returned the exact build `6f7be5da-a57a-4267-a18d-015c6e57b16b` on the version relationship and `releaseType: AFTER_APPROVAL`. The authenticated console confirmed “1 Item Submitted”. Automatic release remains limited to the configured free India/US launch. Submission is not approval or public availability.

The five current screenshots, English listing and functional private reviewer setup are included. App Privacy is published: Email Address, Photos or Videos, Customer Support, Other User Content and User ID, linked to the user, App Functionality; Other User Content also Product Personalization; no tracking. This accounts for optional support and authenticated provider-bound content, despite the client having no backend. Supported OpenAI default abuse-log retention is documented at https://developers.openai.com/api/docs/guides/your-data; `store: false` does not establish zero retention. No claim about NyloHQ upstream identity is inferred.

The complete age questionnaire is saved and independently API-verified with `ageRatingOverrideV2: EIGHTEEN_PLUS` (17+ on older OS ratings). Infrequent general AI mature/medical/non-graphic sexual/violence references are declared; health/wellness topics true; graphic sexual/prolonged sadistic violence and chance-based activities none. Social distribution, interpersonal chat, advertising, browser access, parental controls and age assurance are false. Content-rights information is saved for third-party content access. No unsupported accessibility claim was added.

Latest independent quality remains **88/100 provisional**, below the requested95; physical camera/VoiceOver and other previously recorded product-evidence gaps remain unverified. The owner's latest instruction explicitly directed submission and publication; submission does not retroactively satisfy those evidence goals or guarantee approval. No app-source changes or additional provider requests were made.

Evidence: ignored `artifacts/app-store-preparation/submission15-verified.json`. An enabled four-hour follow-up monitors Apple review through verified public release; next run **9 November 2026, 16:08 IST**. It must avoid duplicate submissions, preserve secrets, handle actual review findings within scope and stop after verified public availability or a required external dependency.

## Prior preparation record (superseded where the submission notice above differs)

Current feedback beta: **1.0.0 (15)**, app source289fa04, signed42563798870, Apple VALID build6f7be5da-a57a-4267-a18d-015c6e57b16b. Actual exported-IPA audit passes11manifests/requiredSDWebImage/camera/noMic/family1/nonexemptfalse. Current compact/large/maximum-text flows, gallery/PDF/attachment checks and bounded live source-adapter memory/context/PDF/image checks pass. Internal Nylo Device QA assignment and IN_BETA_TESTING are verified with English notes. Build14 is the previous beta. Latest independent review021 is88/100 provisional, not95 or production approval.

Store draft1.0.0 remains PREPARE_FOR_SUBMISSION, now with the exact build15 associated. Five current reviewed native screenshots are COMPLETE, updated English copy and private functional review instructions are saved/read-back verified. India/US only, free, no automatic territories/preorders. Support monitoring is owner-confirmed. The review-only key has a1,000,000-token limit and owner-planned revocation after review, without a fixed expiry. Its eight-request automated preflight allowance is exhausted. Final privacy/age declarations and physical/live-native/VoiceOver/owner acceptance remain open. The18+ choice is recorded, but Apple returned500 on the age override; no successful age completion is claimed. No App Review submission or production release has occurred.

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

## Candidate 15 evidence

See STATUS.md, review021 and testing/pdf-attachments.md for exact provenance. The original automatic matrix failed on driver downloads; compact subsequently passed on attempt2, maximum text passed targeted42568691181, and large retained its original current-source pass. General smoke does not prove grouped-picker extremes or VoiceOver. Screenshot refresh42568114632 uses fresh native289, refresh false; the private asset read-back verifies all five current resources. No additional score is inferred from these infrastructure recoveries.
