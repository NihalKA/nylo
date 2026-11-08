# iPhone device check

Validated distribution path: GitHub macOS → signed IPA → App Store Connect processing → internal TestFlight group. Current device beta: **0.1.0 (4)**, source ce00b58. Apple processing state VALID. Internal group Nylo Device QA has one tester (the account holder) and build 4; build 3 was not assigned.

This is a device-validation beta, not App Store publication or final UI approval. Later source improvements will reach a newer candidate.

## Connect NyloHQ in build 4

1. Install through the TestFlight invitation to the Apple Developer Account Holder Apple ID. Requires iOS 16.4 or later.
2. Open Settings → Connect your AI → Custom API.
3. Enter `https://codex.nylohq.com/v1`. Open Advanced settings and choose the Responses API format. Optionally name the connection NyloHQ.
4. Enter your own API key on the phone and model `gpt-6-luna`, then save. Keys must never be pasted into chat, screenshots, bug reports or source files.

The next UI candidate adds a NyloHQ preset so the URL and API format do not require manual entry. A listed model verifies catalog access, not generation or tool compatibility.

## Short device check

- Create an agent, using the Thinking partner template if useful.
- Ask it to remember a short non-sensitive preference, such as preferring concise examples. Approve the memory confirmation.
- Close and reopen Nylo. Check the same fact in the agent's Memory section.
- Start a new conversation with that agent and ask what answer style you prefer.
- Check keyboard clearance, tab navigation, readable text, and whether any labels or controls clip. Drafting and viewing existing history do not require another model call.

Report the iPhone model, iOS version, whether installation/replies/memory persistence worked, and any confusing or broken interactions. Do not report a pass until the actions were actually performed. TestFlight feedback containing real conversations stays private; do not publish it in GitHub Actions artifacts.

## Live adapter evidence

On 8 November 2026, a restricted owner-supplied test key was used outside the repository for model discovery and **three** bounded provider requests, with at most 128 output tokens requested per call. NyloHQ returned the requested streaming test reply. A remember_fact call and its follow-up response completed successfully. This proves the source adapter's live Responses/tool round trip; it does not substitute for native secure storage, device transport or UI testing. No provider test key was placed in CI, public builds or logs.
