# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Confirmed

- User approved end-to-end implementation, public GitHub source, free hosted runners, scored independent model reviews and deployment/submission.
- Support email: admin@colorforfun.app.
- GitHub authenticated as NihalKA; planned repository NihalKA/nylo.
- Original prototype imported without touching its original folder; dependency install complete.
- Expo Doctor: 20/20 checks passed.
- Latest independent milestone score: 72/100 at 267b3ff, with historical native evidence only. Still below the 88 release gate; see docs/reviews/004-consent-recovery-review.md. Its five medium findings are being corrected and require re-review.

## In progress

- iOS-oriented tab navigation, universal inbox, simpler Settings and progressive provider setup.
- Provider discovery, explicit sharing consent, memory change approval, durable credential staging/retirement and failed-checkpoint completion protection.
- Native iOS Release simulator build 337d99e passed and launched; first Chats screenshot reviewed. Current source has an original n+dot app mark. Automated UI flow exposed screenshot path and synthesized accessibility-label selector issues; fixes are being validated. No full UI smoke pass yet. Public privacy/support site is live at https://nihalka.github.io/nylo/; source checks pass.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signing issues corrected. Runs 42475045265 (build 3) and 42476376051 (build 4) uploaded successfully; Apple processing VALID. Build 4 (ce00b58) is assigned to internal QA; see testing/iphone-beta.md.
- Owner tested build 4: reports other behavior appears to work, but agents feel indistinguishable from normal chats and requests about prior discussions receive a transcript-unavailable response. Device model/iOS version and exact saved-fact recall remain unconfirmed. Current source adds a visible memory shortcut and clearer context explanation. A fourth capped NyloHQ request verified synthetic saved-fact recall through the actual adapter/system prompt, not phone persistence. A separately authorized App Review credential is still needed before submission.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

Signed builds and internal TestFlight delivery are verified. Store submission, production launch, physical-device pass and a passing final UI score remain incomplete. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
