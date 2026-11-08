# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Confirmed

- User approved end-to-end implementation, public GitHub source, free hosted runners, scored independent model reviews and deployment/submission.
- Support email: admin@colorforfun.app.
- GitHub authenticated as NihalKA; planned repository NihalKA/nylo.
- Original prototype imported without touching its original folder; dependency install complete.
- Expo Doctor: 20/20 checks passed.
- Latest independent score: 86/100; see docs/reviews/008-memory-relaunch-review.md. Compact/large full smoke and exact saved-memory relaunch pass. Maximum-text setup stops when scrolling opens the keyboard; a compact empty-state heading clips while typing. No high/critical finding is established; source/test fixes await verification. The 88 release gate and separate physical/live/VoiceOver gates remain unmet.

## In progress

- iOS-oriented tab navigation, universal inbox, simpler Settings and progressive provider setup.
- Provider discovery, explicit sharing consent, memory change approval, durable credential staging/retirement and failed-checkpoint completion protection.
- Full native simulator builds through d77f2c0 passed. Matrix 42481190022 produced 22 actual native images and exposed the composer/large-text issues in review 006. Source fixes at 3001389/48064ba/1ba6db3 add the safe-area keyboard offset, explicit dismissal, scrollable/adaptive display heading and memory-input test ID/value/enabled checks. Rerun 42482545085 and independent review are in progress; no full UI smoke pass yet. Refreshed-JS provenance is explicit and never substitutes for final signed-build verification. Public privacy/support site is live at https://nihalka.github.io/nylo/; current source suite has 37 passing tests and CI source checks pass.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signing issues corrected. Runs 42475045265 (build 3) and 42476376051 (build 4) uploaded successfully; Apple processing VALID. Build 4 (ce00b58) is assigned to internal QA; see testing/iphone-beta.md.
- Run 42481219738 uploaded build 5 (eb1cf3a); Apple build ID 5b61a61c-e6ac-4b38-a722-140079e9250d, processing VALID. It predates the keyboard correction and remains unassigned to testers. A later tested candidate must replace it for release.
- Run 42484609771 uploaded build 6 (24aaba2), processing VALID, ID d2198fb8-45f8-463b-88f7-795c2fa2bd3a. Assigned to internal QA with an exact saved-fact recall/keyboard/VoiceOver check requested. New source 2f7b4f0 additionally polishes empty-chat typing and maximum-text form scrolling; matrix 42485786534 is running. Build 6 is a device-validation beta, not release approval.
- Owner tested build 4 on iPhone 17/iOS 26.6.2 and confirms the approved fact is listed in the agent’s Memory screen. Other behavior appears to work, but agents feel indistinguishable from normal chats and requests about prior discussions receive a transcript-unavailable response. Exact saved-fact recall in a new phone conversation remains unconfirmed. Current source adds a visible memory shortcut and clearer context explanation. A fourth capped NyloHQ request verified synthetic saved-fact recall through the actual adapter/system prompt. A separately authorized App Review credential is still needed before submission.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

Signed builds and internal TestFlight delivery are verified. Store submission, production launch, physical-device pass and a passing final UI score remain incomplete. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
