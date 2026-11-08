# Live device check

Implemented after the owner requested a realtime check on the paired iPad. The installed T3 hub exposes simulators/emulators, so this is an on-device Nylo screen, not remote iPad control or automatic reporting to the agent.

Open Settings → Live device check in a build that includes this feature. Choose a saved provider and prepare the local test. Preparation creates a clearly named test agent and two synthetic conversations without network use.

1. Run the live reply and approve the displayed destination, model and cost scope. It makes one request, requests at most 128 output tokens and disables tools. The actual response and text-event count appear on screen. One text event does not prove gradual streaming.
2. Approve the generated test memory. It is saved only to the test agent, using the same durable application storage as ordinary agent memory.
3. Run recall. A fresh conversation sends the test agent's instructions and approved fact, without earlier test history. The returned word must exactly match the generated word to pass. Changed test-agent context is rejected before sending.
4. Close Nylo fully, reopen, return to this screen and check saved data. A different runtime plus the restored agent, exact fact and both conversations establishes this local persistence check. Live response outcomes remain separate. Backgrounding alone does not count as a restart.

Each live attempt has a separate confirmation and never retries automatically. Another app-wide response blocks the test. Stop uses Nylo's ordinary cancellation; backgrounding interrupts active responses and retains checkpointed partial text. Normal chat output limits remain 4096. No provider credential is embedded or copied to reports. Existing agent-side smoke-key allowance does not authorize additional automated requests; on-device tests are initiated by the owner through the explicit cost confirmation.

Test agents and conversations are reserved for this screen: ordinary New chat cannot reuse them, the inbox/libraries exclude them, and ordinary editing/deep links redirect to this screen. Remove test data deletes only the test agent and the two explicitly reserved conversations. Other agents, chats and provider credentials remain. Device-check bookkeeping stays local and is stripped from exports/imports, so a restored backup cannot impersonate a restart result. Synthetic records are still included in user-requested backups until removed.

Fresh attempts reset history only inside the shared send operation after it acquires the active-response lock. Event counts reset durably alongside the accepted response and are published only for completed attempts; interrupted attempts report that the count is unavailable.

Source checks at 6470912: typecheck and 43 tests pass, including protocol-wide token limits, a single-request live-check path, and local-only restart metadata. Gallery automation covers offline preparation, explicit memory approval and reopening without a key or live requests. Current-source compact, large and maximum-text simulator smoke passed, including fresh native run 42498930753 without JS refresh. Final populated gallery 42499737557 passed local preparation, approved memory restoration, scoped cleanup and personal-draft preservation. Live provider, physical-device and VoiceOver results remain unconfirmed; this screen does not certify those independently.
