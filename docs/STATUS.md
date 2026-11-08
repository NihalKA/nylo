# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Confirmed

- User approved end-to-end implementation, public GitHub source, free hosted runners, scored independent model reviews and deployment/submission.
- Support email: admin@colorforfun.app.
- GitHub authenticated as NihalKA; planned repository NihalKA/nylo.
- Original prototype imported without touching its original folder; dependency install complete.
- Expo Doctor: 20/20 checks passed.
- Latest independent milestone score: 68/100 at fc9c4bb, including an actual native Chats render from 337d99e. Still below the 88 release gate; see docs/reviews/003-native-review.md. New source fixes await re-review.

## In progress

- iOS-oriented tab navigation, universal inbox, simpler Settings and progressive provider setup.
- Provider discovery, explicit sharing consent, memory change approval, durable credential staging/retirement and failed-checkpoint completion protection.
- Native iOS Release simulator build 337d99e passed and launched; first Chats screenshot reviewed. Current source has an original n+dot app mark. Automated UI flow initially failed on Maestro screenshot path configuration; corrected and retrying. Public privacy/support site is live at https://nihalka.github.io/nylo/; source checks pass.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signed runs exposed DateTime comparison, PKCS12 import compatibility and Fastlane export enum issues. Corrected; third run 42475045265 is building. No successful TestFlight upload yet.
- Physical iPhone testing and review/test provider credential with explicit spend budget still needed before production.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

No completed signed native build, TestFlight upload, store submission, production launch, physical-device pass, or passing final visual score has been achieved yet. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
