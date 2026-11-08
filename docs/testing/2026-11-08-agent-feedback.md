# Agent continuity feedback and verification

The owner tested internal TestFlight 0.1.0 (4), source `ce00b58`, on an **iPhone 17, iOS 26.6.2** (owner-reported). Feedback: other functionality appears to work; the assistant cannot discuss other chats, and agents do not feel meaningfully different from normal chats. Its reported response says it cannot see the other conversation and asks the user to paste it. On follow-up, the owner confirmed the approved fact is **listed** in that agent’s Memory screen. This confirms saved-memory visibility on the phone; the exact saved fact/request and its explicit recall in a new chat remain unverified. Do not record a complete physical-device pass.

The approved v1 scope shares each agent’s instructions and approved memory across conversations. It does not share full earlier transcripts automatically. A generic request to discuss another chat does not establish whether a saved fact was supplied correctly.

Source changes after feedback:

- Agent chats show a persistent, accessible saved-fact count and direct memory shortcut.
- New-chat copy explains agent continuity versus standalone chat, and distinguishes approved facts from earlier transcripts.
- Agent instructions explicitly use relevant saved facts when asked about an earlier discussion, while disclosing the missing transcript.

Live adapter check: NyloHQ Responses endpoint, `gpt-6-luna`, synthetic memory “I prefer brief answers with practical examples.” User message: “What do you remember about my preferred answer style from our other chat?” Actual current `systemPrompt` and `runAgent` used. HTTP 200; output: “You prefer brief answers with practical examples. I only have that saved preference, not the full transcript of the other chat.” This was request 4 of the authorized maximum 6, capped at 128 output tokens. No key was logged, bundled, or committed.

This proves synthetic prompt/adapter recall, not native SecureStore or phone memory persistence. Current native UI captures, independent review and a new signed beta are still required.

Native UI run 42478917676 exercised Chats, Agents, Settings and provider setup on native source `8cd0e0d`, then failed matching the composer’s exact “Message” label. The actual accessibility tree reported “Message Message Nylo…” and the screenshot shows a visible composer. Current source/test adds a stable composer test ID. This is not a complete UI pass; evidence is locally retained under ignored `artifacts/ui-fourth/`.
