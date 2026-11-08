# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Confirmed

- User approved end-to-end implementation, public GitHub source, free hosted runners, scored independent model reviews and deployment/submission.
- Support email: admin@colorforfun.app.
- GitHub authenticated as NihalKA; planned repository NihalKA/nylo.
- Original prototype imported without touching its original folder; dependency install complete.
- Expo Doctor: 20/20 checks passed.
- Latest independent current-evidence score: 58/100 at 1079f85 (58/70 assessed, 30 current visual/native points withheld). This changes the historical-credit convention used for 72/100; see docs/reviews/005-recovery-recheck.md. Five prior findings are corrected; two follow-up medium findings have source fixes and regression checks. Current native evidence and final re-review remain required for the 88 release gate.

## In progress

- iOS-oriented tab navigation, universal inbox, simpler Settings and progressive provider setup.
- Provider discovery, explicit sharing consent, memory change approval, durable credential staging/retirement and failed-checkpoint completion protection.
- Native iOS Release simulator builds through a8768b6 passed. Actual older screenshots cover Chats, Agents, Settings, provider setup and composer; a full UI smoke pass is still missing. Exact composer-label mismatch is fixed using a stable test ID. New profile jobs hit iOS 26.5 XCTest startup timeouts before exercising the app; the rerun uses the previously working 26.2 runtime, longer startup allowance and launch/driver diagnostics. Current-JS UI run 42481190022 and fresh signed candidate 42481219738 are in progress. Refreshed-JS provenance is explicit and never substitutes for final signed-build verification. Public privacy/support site is live at https://nihalka.github.io/nylo/; current source suite has 37 passing tests.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signing issues corrected. Runs 42475045265 (build 3) and 42476376051 (build 4) uploaded successfully; Apple processing VALID. Build 4 (ce00b58) is assigned to internal QA; see testing/iphone-beta.md.
- Owner tested build 4 on iPhone 17/iOS 26.6.2 and confirms the approved fact is listed in the agent’s Memory screen. Other behavior appears to work, but agents feel indistinguishable from normal chats and requests about prior discussions receive a transcript-unavailable response. Exact saved-fact recall in a new phone conversation remains unconfirmed. Current source adds a visible memory shortcut and clearer context explanation. A fourth capped NyloHQ request verified synthetic saved-fact recall through the actual adapter/system prompt. A separately authorized App Review credential is still needed before submission.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

Signed builds and internal TestFlight delivery are verified. Store submission, production launch, physical-device pass and a passing final UI score remain incomplete. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
