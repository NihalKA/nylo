# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Confirmed

- User approved end-to-end implementation, public GitHub source, free hosted runners, scored independent model reviews and deployment/submission.
- Support email: admin@colorforfun.app.
- GitHub authenticated as NihalKA; planned repository NihalKA/nylo.
- Original prototype imported without touching its original folder; dependency install complete.
- Expo Doctor: 20/20 checks passed.
- Latest independent score: 82/100 after native keyboard recheck; see docs/reviews/007-keyboard-recheck.md. The high composer overlap, maximum-text Settings and draft restart are corrected/verified. Missing memory dismissal, a clipped maximum-text dismissal target and incomplete settled multiline/agent/memory tests remain medium findings with source fixes awaiting validation. The 88 release gate remains unmet.

## In progress

- iOS-oriented tab navigation, universal inbox, simpler Settings and progressive provider setup.
- Provider discovery, explicit sharing consent, memory change approval, durable credential staging/retirement and failed-checkpoint completion protection.
- Full native simulator builds through d77f2c0 passed. Matrix 42481190022 produced 22 actual native images and exposed the composer/large-text issues in review 006. Source fixes at 3001389/48064ba/1ba6db3 add the safe-area keyboard offset, explicit dismissal, scrollable/adaptive display heading and memory-input test ID/value/enabled checks. Rerun 42482545085 and independent review are in progress; no full UI smoke pass yet. Refreshed-JS provenance is explicit and never substitutes for final signed-build verification. Public privacy/support site is live at https://nihalka.github.io/nylo/; current source suite has 37 passing tests and CI source checks pass.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signing issues corrected. Runs 42475045265 (build 3) and 42476376051 (build 4) uploaded successfully; Apple processing VALID. Build 4 (ce00b58) is assigned to internal QA; see testing/iphone-beta.md.
- Run 42481219738 uploaded build 5 (eb1cf3a); Apple build ID 5b61a61c-e6ac-4b38-a722-140079e9250d, processing VALID. It predates the keyboard correction and remains unassigned to testers. A later tested candidate must replace it for release.
- Owner tested build 4 on iPhone 17/iOS 26.6.2 and confirms the approved fact is listed in the agent’s Memory screen. Other behavior appears to work, but agents feel indistinguishable from normal chats and requests about prior discussions receive a transcript-unavailable response. Exact saved-fact recall in a new phone conversation remains unconfirmed. Current source adds a visible memory shortcut and clearer context explanation. A fourth capped NyloHQ request verified synthetic saved-fact recall through the actual adapter/system prompt. A separately authorized App Review credential is still needed before submission.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

Signed builds and internal TestFlight delivery are verified. Store submission, production launch, physical-device pass and a passing final UI score remain incomplete. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
