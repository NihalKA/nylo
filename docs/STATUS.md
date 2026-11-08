# Delivery status

Updated: 8 November 2026. Active target: iOS App Store. Android publication deferred until iOS is published and validated; do not purchase a Google developer account yet.

## Current evidence

- App source: `64709129f17968031bd000b9898162d87f4a6d92`. Subsequent commits through `0e55469` change only gallery fixtures; app/native configuration/assets are identical.
- Source checks: 43 behavioral tests, typecheck, formatting and credential audit passed. No new live provider requests were used.
- Full native build [42497575404](https://github.com/NihalKA/nylo/actions/runs/42497575404) passed for app 6470912.
- Smoke [42497578413](https://github.com/NihalKA/nylo/actions/runs/42497578413) passed compact, large and maximum text with refreshed current JS. Strict single-tap keyboard dismissal, draft relaunch, saved memory/relaunch and agent composition completed.
- Fresh-native smoke [42498930753](https://github.com/NihalKA/nylo/actions/runs/42498930753) also passed all three profiles. Maximum-text provenance identifies native/JS/flows 6470912, refresh false, iOS 26.2; keyboard and restored-memory PNGs inspected. This resolves the earlier stale-source and maximum-text fixture blockers.
- Current populated gallery [42499737557](https://github.com/NihalKA/nylo/actions/runs/42499737557) passed. It verifies focused picker selection/provider navigation, starter and role draft safety, full long-history answer visibility, exact clipboard and scoped device-check restart/cleanup. All answers are explicitly synthetic.
- Signed [42497581610](https://github.com/NihalKA/nylo/actions/runs/42497581610) uploaded **0.1.0 (10)** from 6470912. Apple VALID, build ID `8099fcdf-ad35-4d66-a200-9e270507c3f0`. Assigned to internal Nylo Device QA with disclosed gaps; POST 204 and subsequent group GET verified. Build 8 is the older design.

## Product acceptance

Owner rejected the earlier interface and named ChatGPT/Grok as quality references. Current source implements conversation-first hierarchy, focused model selection, quieter controls, grouped Settings, simpler provider setup and protected drafts. Actual native screenshots are retained in ignored artifacts/native-product-captures. See PRODUCT_DESIGN.md.

Latest independent assessment is **85/100 provisional** for app6470912, documented in reviews/016-current-native-beta.md. Current gallery and fresh-native smoke resolve earlier blocked paths. Maximum-text empty-chat clipping and inefficient memory layout remain; owner acceptance, physical/live and VoiceOver evidence are still missing. Internal feedback beta is recommended and build10 assigned; design/production acceptance remain held.

## Physical and live checks

Settings → Live device check implements explicit per-action consent, one request capped at 128 output tokens, approved test-memory recall, restart verification and scoped cleanup. Results remain on device; no owner results have been received.

The wired iPad A16/iOS 26.6.1 is paired, connected and Developer Mode enabled. Finder trust is complete. T3 Beta 0.1.7 exposes only simulators; physical device_open rejected the iPad. Local simulator navigation succeeded, but screenshot capture failed twice after refresh, so local interaction stopped. No physical-device or VoiceOver pass is inferred. CI uses real Apple iPhone Simulator runtimes, not a browser mockup; it does not establish physical iPhone behavior.

## External dependencies

- Apple sign-in verified: active individual membership; seller Nihal K A. Agreement warning cleared after owner acceptance. Dedicated App Manager API key, bundle ID, distribution certificate and App Store provisioning profile created; credentials are outside the repository and in encrypted GitHub environment secrets. App Store record created: https://appstoreconnect.apple.com/apps/6832224555. Signing issues corrected. Runs 42475045265 (build 3) and 42476376051 (build 4) uploaded successfully; Apple processing VALID. Build 4 (ce00b58) is assigned to internal QA; see testing/iphone-beta.md.
- Run 42481219738 uploaded build 5 (eb1cf3a); Apple build ID 5b61a61c-e6ac-4b38-a722-140079e9250d, processing VALID. It predates the keyboard correction and remains unassigned to testers. A later tested candidate must replace it for release.
- Run 42484609771 uploaded build 6 (24aaba2), processing VALID, ID d2198fb8-45f8-463b-88f7-795c2fa2bd3a. Assigned to internal QA with an exact saved-fact recall/keyboard/VoiceOver check requested. New source 2f7b4f0 additionally polishes empty-chat typing and maximum-text form scrolling; matrix 42485786534 is running. Build 6 is a device-validation beta, not release approval.
- Owner tested build 4 on iPhone 17/iOS 26.6.2 and confirms the approved fact is listed in the agent’s Memory screen. Other behavior appears to work, but agents feel indistinguishable from normal chats and requests about prior discussions receive a transcript-unavailable response. Exact saved-fact recall in a new phone conversation remains unconfirmed. Current source adds a visible memory shortcut and clearer context explanation. A fourth capped NyloHQ request verified synthetic saved-fact recall through the actual adapter/system prompt. A separately authorized App Review credential is still needed before submission.
- Final privacy data inventory, age rating and legal publisher details require actual account/app information.
- The reporting service is not deployed. Android reporting requirements are documented but Android publication is deferred.

## Release claims

Signed builds and internal TestFlight delivery are verified. Store submission, production launch, physical-device pass and a passing final UI score remain incomplete. App Store listing, category, support and privacy URLs are saved as drafts; reviewer live access and final disclosures remain incomplete. Independent reviewers must label missing evidence explicitly.
