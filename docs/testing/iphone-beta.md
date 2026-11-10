## Signed release recovery — 18 not uploaded, 19 running

Workflow42729756232 exported1.0.0(18), with actual family1/eleven privacy manifests/required SDK/camera/no microphone or tracking verified. It failed before upload at `codesign` in the signing audit; no successful signing report was emitted. Apple still lists17/16/15. An existing signed system binary reproduces the audit bug: `--extract-certificates PREFIX APP` treats PREFIX as an input file, while `--extract-certificates=PREFIX APP` extracts the leaf correctly. The fix preserves all strict signature, exact certificate/team/app/profile and font assertions and adds bounded path-redacted failure diagnostics.

The failed IPA was not retained, so one replacement signed delivery run is necessary. Workflow42732648140 is confirmed as build19, sourcec6f333c/appa0afe7e. Completed native/UI evidence is retained; no new Simulator or Android compilation is dispatched. New Apple availability remains unverified and initial Store15 is untouched.

Current product `a0afe7e` has accepted current native UI evidence. Signed18 workflow42729756232 stopped before upload at an audit invocation bug. Replacement signed19 workflow42732648140 is running on release headc6f333c/appa0afe7e, with unchanged strict signing/font assertions. Actual IPA audits, Apple processing and internal tester availability remain to be verified. Android12 is already delivered. Earlier76/11 evidence below is historical; no new TestFlight or Drive upload is claimed.

# Expanded iPhone beta check

**Current Figma redesign is not delivered in TestFlight yet.** Producta0afe7e's fresh native42722415418 succeeds, with independent actual privacy/linked-identity/font verification. Automatic42725119521 passes compact109/13, large109/13 and maximum text113/13 with48 inspected PNGs; PDF42725170655 passes58 commands with9 inspected PNGs and exact draft/protocol/native SQL/blob checks. All actual UI JavaScript bytes match the fresh native bundle. Original gallery42725164453 fails119/1 at a role chip behind the header; corrected test-only gallery42727348004 passes192 commands with20 inspected native captures, exact293-byte copy and native SQL/blob checks on the same native with refreshfalse. All current native/design gates are clear. Signed18 workflow42729756232 stopped before upload at the audit invocation bug described above. Corrected release19 workflow42732648140 is running; actual IPA audits, Apple processing and internal QA availability remain to be verified. Local82 tests/typecheck/format/security183/font11 and SourceCI42722410071 pass. The report surface correction responds to actual Android11 native pixels, not a speculative palette change.

Interim76 fresh native42717459570 has verified privacy, linked simulator identity and11 exact font assets. Automatic42720294162 passes compact109/13, large109/13 and maximum text118/11; all48 native captures are inspected. Gallery42720606388 passes188 commands, exact293-byte clipboard and executed native SQL/blob assertions (19 native captures); PDF42720612010 passes58 commands and exact draft/protocol/blob assertions (9 native captures). All76 native captures, GitHub digests/CRC and fixture8888f2d hashes verify, with refreshfalse. These results preserve completed regression proof while the actual report-fill correction requires its own final native evidence.

Interimbe native42708462482 has verified privacy, linked simulator identity and11 font assets. Compact/large42711405045 pass109/13 each; maximum text remains a preserved82/13/1 nested-scroll product failure that prompted the current fix. Gallery42711555177 passes188/exact293-byte copy/native SQL/blob checks; PDF42711561212 passes58 commands and storage/draft/protocol assertions. All selected captures/provenance verify. Store15's relationship is protected; the separate monitor's latest Anand17 access state is recorded in STATUS.

Current internal feedback beta **1.0.0 (17)**, signed run 42612628652/source e452a2d, Apple VALID build 4e6626be-2598-4c2e-a7ae-72e9b628ff51. Exact internal QA assignment and IN_BETA_TESTING are independently verified. Update Nylo through TestFlight and confirm the build number.

Build 17 adds Responses as the default for new custom API connections and limited background completion for an already-started iPhone response. Existing saved connections and keys stay unchanged. It also carries build16's compact PDF cards, keyboard-open Remove and explicit API-format editor. Provider/model PDF capability still applies.

Fresh native simulator checks cover compact, large and maximum text. Owned local streaming verifies completion while Home, memory interruption without saving, Stop, cold restoration and native assertion cleanup. These are synthetic replies, not physical/live-provider or VoiceOver certification. iOS chooses background time; long requests, locking, force-quit or resource pressure can interrupt. Partial text is kept at the last durable checkpoint. Retry makes a new provider request and can incur charges. Build 15 remains the initial App Store submission;17 is internal feedback only.

First try a short reply with your chosen provider, briefly switch to another app and return. Check the answer. After it finishes, close/reopen Nylo and confirm the answer remains. During another response, try Stop and check that its partial text is retained without an automatic resend. Memory decisions require foreground review; a memory request received while away must not silently add a fact. These live checks use your provider account and can incur charges.

For the expanded feedback beta, check these on your iPhone:

1. **Models:** Settings → Connect your AI. Select multiple returned models or all shown models; save. Switch the active model in a chat without losing its draft. One model runs per send. Catalog presence does not guarantee image/PDF/tool support.
2. **Agent continuity:** create an agent and add an approved harmless memory. Start another conversation with that same agent and ask for it. Optionally enable/review recent-chat context, discuss a harmless fact, then ask in another same-agent chat. Confirm other agents do not share it. Deleting a memory does not erase old chat mentions.
3. **Attachments:** use an owned photo, small PDF/text file and camera capture; cancel a picker and deny camera access once. Confirm you can keep writing, remove an attachment, close/reopen with the draft preserved, and choose whether to send to the named provider. Picking alone uploads nothing. Actual sending can incur provider charges.
4. **Live check:** Settings → Live device check. Prepare, run live reply, approve the synthetic fact, run recall, then fully close/reopen and check restoration. Each live action explicitly confirms one request capped128output tokens. Ordinary chat calls use the normal output limit. Clean up test data and confirm personal drafts remain.
5. **Usability:** judge design against the requested ChatGPT/Grok direction. Try larger text and VoiceOver for Message, Send, model picker, Memory, attachments and back navigation. Use the background/Stop checks above only if you choose to incur those requests; verify an honest interrupted state and explicit retry when iOS stops a request.

Report phone/iOS/build and actual outcomes. Never include keys, private documents/photos or full personal conversations. Results remain on device until you share them. Simulator passes do not replace these checks; Apple approval/public release and the documented product-evidence gaps remain separate.

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

Before the next signed upload, the release lane now also runs `scripts/audit-ios-signing.py` on the **actual exported IPA**. It requires strict signature verification, the same protected distribution certificate, exact app/team/version/build identity, non-debug entitlements and a matching unexpired embedded App Store profile. Only a summary and IPA hash are retained in `ipa-signing-audit.json`; certificates, provisioning profiles and credentials are not included. Local negative checks reject unsafe archives and unsigned app bundles without emitting a success report. This audit has not yet run on build18; distribution remains held until current native/design QA passes.

The exported-IPA signing audit now also requires all11 actual runtime font files to match source hashes exactly, with no missing/modified/duplicated face. This release-only guard passes on the fresh compiled Simulator font assets and rejects deliberate altered/duplicate test copies. It does not claim an18 IPA pass: that actual signed audit has not run yet.
