# Finite iOS background responses

Nylo previously aborted an active response whenever AppState was not active,
including brief inactive transitions. The new iOS local Expo module obtains a
UIKit background-task assertion for an already-started response. It releases
that assertion after completion, stop, error, or cancellation. Native expiration
ends the assertion immediately and signals JS to interrupt the matching response.
There is no background mode, scheduled refresh, new server, or automatic retry.

The system chooses the available background time. Long requests, force-quit,
process termination, and resource pressure can still interrupt a response. Partial
output continues using the existing durable streaming checkpoints and launch
recovery; bytes arriving after the last saved checkpoint may be lost if iOS
suspends or terminates the process. Retry is a new billable provider request.
The existing three-minute request timeout remains. Agent memory decisions require
foreground review; a tool asking for a decision while backgrounded interrupts
the request without changing memory.

Android, web, Expo Go, and older native runtimes without this module retain
foreground-only behavior. Brief inactive transitions no longer stop requests.
This change requires a new standalone iOS build; a JS-only refresh of an older
runtime cannot verify it. The CI native-input checks now include local modules.

## Source validation

- Typecheck and 82 tests pass, including lease expiration, stale tokens,
  cleanup, denied/unavailable native assertions, begin/expiration races, cancellation during native acquisition and disposal of a late grant.
- Formatting passes. Swift parser and Ruby podspec syntax checks pass.
- Expo Apple autolinking resolves NyloBackgroundResponseModule and its pod.
- The production iOS JS export passes.

These checks do not establish native compilation, physical-device background
execution, battery behavior, or signed TestFlight delivery.

## Native acceptance still required

Use the newly compiled standalone app and an owned synthetic test document or
short text prompt. Verify that an active response can finish after switching to
another app or locking the screen, then return and cold-launch to check the saved
answer. Verify foreground Stop, ordinary completion, and request failures release
the native assertion, and that repeated sends do not accumulate assertions.
Exercise expiration, returning after the request deadline, foreground memory
approval, background memory-tool interruption, and force-quit recovery. Verify
no automatic repeat request or unapproved memory change occurs. A simulator pass
alone cannot establish physical-device time grants.
