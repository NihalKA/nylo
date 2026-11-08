# Expanded iPhone beta check

Prepared candidate **1.0.0(13)**, source4d3687d, Apple VALID ID e6568582-6b46-4061-ab81-df09b8a6fca4. Assigned to internal Nylo Device QA with English notes; POST204 and subsequent group GET verify the exact VALID build. Update through TestFlight. Review020supports this narrow feedback/device-validation beta at86/100;95target and production gates remain open. The historical build10 guide below is superseded.

For the expanded feedback beta, check these on your iPhone:

1. **Models:** Settings → Connect your AI. Select multiple returned models or all shown models; save. Switch the active model in a chat without losing its draft. One model runs per send. Catalog presence does not guarantee image/PDF/tool support.
2. **Agent continuity:** create an agent and add an approved harmless memory. Start another conversation with that same agent and ask for it. Optionally enable/review recent-chat context, discuss a harmless fact, then ask in another same-agent chat. Confirm other agents do not share it. Deleting a memory does not erase old chat mentions.
3. **Attachments:** use an owned photo, small PDF/text file and camera capture; cancel a picker and deny camera access once. Confirm you can keep writing, remove an attachment, close/reopen with the draft preserved, and choose whether to send to the named provider. Picking alone uploads nothing. Actual sending can incur provider charges.
4. **Live check:** Settings → Live device check. Prepare, run live reply, approve the synthetic fact, run recall, then fully close/reopen and check restoration. Each live action explicitly confirms one request capped128output tokens. Ordinary chat calls use the normal output limit. Clean up test data and confirm personal drafts remain.
5. **Usability:** judge design against the requested ChatGPT/Grok direction. Try larger text and VoiceOver for Message, Send, model picker, Memory, attachments and back navigation. Stop/background one ordinary response only if you choose to incur that provider request, then verify an honest interrupted state and explicit retry.

Report phone/iOS/build and actual outcomes. Never include keys, private documents/photos or full personal conversations. Results remain on device until you share them. Simulator passes do not replace these checks; App Store production remains held.

---

## Historical build10 device guide

Validated distribution path: GitHub macOS → signed IPA → App Store Connect processing → internal TestFlight group. New design candidate: **0.1.0 (10)**, app source `6470912`, uploaded by [42497581610](https://github.com/NihalKA/nylo/actions/runs/42497581610). Apple processing VALID; build ID `8099fcdf-ad35-4d66-a200-9e270507c3f0`. Assigned to internal Nylo Device QA; assignment and English test notes verified. Build 8 remains available as the older design.

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

Gallery 42499737557 passed picker/provider navigation, draft/role protection, full latest history answer, exact copy and local-check restart/cleanup with personal-draft preservation. Its responses/recovery are synthetic offline fixtures, not evidence of live generation or recovery. Review 016 recommends build10 for internal feedback, 85/100 provisional. Maximum-text empty chat can start partly above the visible region after dismissal; memory rows remain spacious.

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
