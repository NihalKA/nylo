# iPhone device check

Validated distribution path: GitHub macOS → signed IPA → App Store Connect processing → internal TestFlight group. Current device beta: **0.1.0 (6)**, source 24aaba2, uploaded by run 42484609771. Apple processing VALID; build ID d2198fb8-45f8-463b-88f7-795c2fa2bd3a. Internal group Nylo Device QA has one tester (the account holder), with builds 6 and 4. Build 5 predates the keyboard correction and remains unassigned.

This is a device-validation beta, not App Store publication or final UI approval. Later source improvements will reach a newer candidate.

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
