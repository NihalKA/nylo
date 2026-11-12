# Concurrent chat responses

Implementation base: `origin/main` at `2706b72199d198b7e873bbd7b56d0d98d88805f9`.

Each ordinary chat reserves its own active response before any asynchronous
preparation. Duplicate sends in that chat are rejected, while other chats can
send independently. Progress, cancellation, timers and iOS background leases
belong to their individual response. Finishing or failing a response removes
only that response's state. The chat list can show multiple replying chats.

SQLite storage and its schema are unchanged. The existing durable update queue
continues to apply each save to the latest app state. Permission prompts are
serialized; stopped requests cannot consume a later approval. Prompts identify
the originating chat. Concurrent provider approvals retain any scopes already
approved by another chat. Existing global guards for provider changes, backup
restore, shared destructive actions and live device checks remain in place.

## Automated verification

`npm run check` runs TypeScript checking and the complete test suite.
`tests/store-concurrency.test.ts` mounts the real StoreProvider with React and
mocks platform/storage/network boundaries. It covers overlapping image/text
responses, completion ordering, cancellation with partial output/files, errors,
duplicate sends during preparation, cancellation during approval, background
eligibility, interleaved write failure, shared-agent memory proposals, retained
provider approval scopes, new-chat reuse, stale progress callbacks and diagnostic
exclusivity. `tests/approval-queue.test.ts` covers nonoverlapping prompts, stopped
requests and foreground-only approval.

These tests make no live provider requests. Existing SDK and persistence tests
continue to cover protocol routing, attachments, retries and restoration.

## iOS observation — 2026-11-12

Before the release dependency patch updates below, observed the working source in Expo Go on the iPhone 17 Pro simulator, iOS 26.4.
A temporary Metro resolver replaced storage with synthetic in-memory chats and
transport with local SSE responses for `https://example.invalid/v1`. The actual
chat UI, StoreProvider and SDK engine ran. No provider network requests or real
credentials were used. The temporary resolver and fixture source were removed
after the check; they are not part of the product.

Observed sequence:

1. Started chat A's reply and navigated to B. B's Send and attachment controls
   remained enabled.
2. Sent B and observed both conversation rows marked Replying.
3. B completed while A remained marked Replying.
4. Stopped A. Its partial reply remained, its interrupted explanation appeared,
   and attachment/retry controls became available again.

Local screenshots are retained under `artifacts/concurrent-chats-qa/`:
`b-send-enabled.png`, `both-running.png`, `b-complete-a-running.png`,
`a-stopped.png`. They document synthetic UI behavior, not native SQLite writes,
real provider performance, image-service behavior or an installed release build.

Android device verification was unavailable: the device inventory reported
“Android SDK was not found.” No native build, upload or release distribution was
performed. iOS background leases remain subject to the operating system's limits;
force-closing the app does not keep requests running.

## Final check results

- TypeScript and all 142 app tests passed.
- All 35 historical-verifier Python regression tests passed.
- Repository formatting, diff whitespace, credential, font and asset checks passed.
- The initial Expo Doctor run passed 19 of 20 checks because main used the
  preceding Expo/SQLite patches. Release preparation updates `expo` to
  `~58.0.25` and `expo-sqlite` to `~58.0.17`. After those updates, all 20 checks,
  formatting, TypeScript and all 142 app tests pass. Fresh native CI builds are
  required for the updated dependencies; the initial Expo Go observation above
  does not certify those candidate binaries.
