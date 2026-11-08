# Live device-check source review

8 November 2026. Independent GPT-6 Astra reviewed clean source 920d9ad, read-only. No current-feature rendered, live-provider or physical evidence was available. Provisional 83/100: task 24/25, navigation 17/20, visual 16/20, accessibility 12/15, trust 7/10, native 7/10. Release gate not met.

High: ordinary blank-chat reuse could return the reserved live-test conversation, allowing personal work to be cleared by a rerun or cleanup. Ordinary editing also weakened response provenance. Medium: a terminated repeat attempt could retain a previous attempt's persisted stream-event count.

The reviewer supported the explicit memory approval, shared secure-store/provider/checkpoint/cancellation path, fresh-context exact recall, 128-token cap, disabled tools, no automatic retries and local-only restart bookkeeping. Native validation 42489756339, beta 42489757061 and gallery 42489760952 were running; smoke 42489763419 was queued. No new native points were awarded.

Follow-up: cancelled signed run 42489757061 before upload. Reserved IDs are excluded from normal blank reuse and ordinary inboxes/libraries; ordinary routes and sends cannot edit test records. Cleanup removes only the two reserved conversations and test agent. History resets inside the shared send's active-response lock, with a durable event-count reset; incomplete attempts have no completed count. Added a personal-message/draft preservation regression and native gallery path. Typecheck and 40 tests pass. Independent recheck and native evidence remain required.
