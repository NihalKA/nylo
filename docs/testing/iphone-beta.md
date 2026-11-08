# iPhone device check

Validated distribution path: GitHub macOS → signed IPA → App Store Connect processing → internal TestFlight group. New design candidate: **0.1.0 (10)**, app source `6470912`, uploaded by [42497581610](https://github.com/NihalKA/nylo/actions/runs/42497581610). Apple processing VALID; build ID `8099fcdf-ad35-4d66-a200-9e270507c3f0`. Assignment awaits the final synthetic gallery. Build 8 remains the older owner-QA design until assignment is verified.

This is a design-feedback/device-validation beta. Owner design acceptance and production approval remain open. Build 9 was cancelled and never assigned.

## iPhone checks for build 10

1. Update through TestFlight and verify **0.1.0 (10)**. Judge the conversation, model picker, inbox and Settings against the requested ChatGPT/Grok quality direction; identify screens that still feel unfinished.
2. Type a multiline draft, dismiss the keyboard once, navigate away and fully close/reopen. Confirm the draft survives and controls remain reachable. Quick starters must not replace an existing draft.
3. Open Settings → Live device check. Choose your saved provider and prepare the local test. Run live reply, approve the generated test fact and run recall. Each live action asks consent for one request capped at 128 output tokens, tools disabled. The provider can charge for these requests. Never share keys in chat or feedback.
4. Fully close/reopen Nylo, return to Live device check and select Check after reopening. Confirm approved test memory and local state restored. Remove test data and confirm personal chats/drafts remain.
5. If testing an ordinary live conversation, stop a response and background/return during another. Check the interrupted state and usable draft/history. Ordinary chats use the normal provider settings and output limit; the live-check cap does not apply to them.
6. Enable larger text and VoiceOver. Check reading order and operation of Message, Send, model selection, Memory and navigation. Report clipped or unreachable controls.

Report phone model, iOS version, build and actual outcomes. Results remain on device; no automatic report reaches the agent. Do not include keys or private conversations. See live-device-check.md for isolation and request limits.

## Simulator evidence

[42497578413](https://github.com/NihalKA/nylo/actions/runs/42497578413) passed all three profiles with refreshed 6470912 JS. [42498930753](https://github.com/NihalKA/nylo/actions/runs/42498930753) passed all three using fresh native/JS/flows 6470912 without refresh: compact iPhone SE third generation, iPhone 17 Pro Max, and maximum accessibility text on iOS 26.2. This includes strict single-tap keyboard dismissal, draft relaunch, approved memory save/relaunch and agent composition. It is real Apple Simulator evidence, not a physical-device, VoiceOver or live-provider pass.

Gallery 42499737557 remains pending. Its responses/recovery are synthetic offline fixtures, not evidence of live generation or recovery.

## Connect NyloHQ in build 6

1. Install through the TestFlight invitation to the Apple Developer Account Holder Apple ID. Requires iOS 16.4 or later.
2. Keep your existing connection when updating. To add one, open Settings → Connect your AI → NyloHQ.
3. The preset fills `https://codex.nylohq.com/v1` and Responses automatically.
4. Enter your own API key on the phone, find available models or enter `gpt-6-luna`, then save. Keys must never be pasted into chat, screenshots, bug reports or source files.

A listed model verifies catalog access, not generation or tool compatibility. Build 6 includes the native keyboard fix and visible agent-memory shortcut. Later source changes polish the compact empty state and maximum-text form tests; they are not in build 6.

## Short device check

- Create an agent, using the Thinking partner template if useful.
- Say “Remember that I prefer brief answers with examples.” Approve the memory confirmation.
- Close and reopen Nylo. Check the same fact in the agent's Memory section.
- Start a new conversation from that same agent and ask “How do I prefer answers?” Report the actual reply. A generic request about an earlier transcript tests a different feature: full earlier transcripts are not automatically shared.
- Check keyboard clearance, tab navigation, readable text, and whether any labels or controls clip. Drafting and viewing existing history do not require another model call.
- If available, use VoiceOver to check that Message, Send and Memory are announced and usable. No VoiceOver pass is currently claimed.

Report the iPhone model, iOS version, whether installation/replies/memory persistence worked, and any confusing or broken interactions. Do not report a pass until the actions were actually performed. TestFlight feedback containing real conversations stays private; do not publish it in GitHub Actions artifacts.

## Live adapter evidence

On 8 November 2026, a restricted owner-supplied test key was used outside the repository for model discovery and **four** bounded provider requests, with at most 128 output tokens requested per call. NyloHQ returned the requested streaming test reply. A remember_fact call and its follow-up response completed successfully. A fourth request verified recall from synthetic saved memory using the current system prompt; see 2026-11-08-agent-feedback.md. This proves the source adapter's live Responses/tool round trip; it does not substitute for native secure storage, device transport or UI testing. No provider test key was placed in CI, public builds or logs.
