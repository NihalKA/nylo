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

## Resumed native acceptance

The owner explicitly resumed this work in the destination thread. Review added AbortSignal cancellation during native acquisition and disposal of a late native grant, and checks foreground state again after a memory-approval dialog. Source validation passes82tests. Custom API now defaults to Responses for new connections only; existing saved connections/credentials are not migrated.

Native42590815925 compiled and launched the new module at2eeaab5, with a passing actual compiled privacy audit. The current-source native run42592315108 is separate. The old native's automatic UI run is stale/NOTRUN because the source advanced; it is not a passing interaction matrix.

Scenario `background`, run42594020199, uses an owned localhost-only HTTPS/SSE server and disposable CI fixtures. The driver leaves Nylo on Home while a host-side SQLite gate requires durable completion before launch. Another request asks for a memory while Home and must interrupt without saving; foreground Stop and cold restoration are checked. It uses a public dummy fixture key, never a provider/reviewer key. Exactly one request per fixture model is required. Static native begin/end active-count logs are retained for cleanup inspection. The local fixture's TLS/SSE and SQLite gate and the actual app data parser/refusal checks pass; these do not establish native background behavior. The native flow and actual captures/logs are pending at this checkpoint. Physical time grants, screen lock, force-quit/resource behavior and real provider streaming remain separate.

## Current native runtime and credential setup boundary

Fresh native42592315108 compiles current app872837a. Its automatic42596718202 reports all three profiles successful; artifact inspection is still pending. Background42597084080 reached and filled the normal provider editor but failed Save: actual PNG/AX report SecureStore `setValueWithKeyAsync`, required entitlement absent. No generation request was made and no background feature pass is claimed. Evidence: `artifacts/background-settings-flow`.

The simulator archive is deliberately compiled with CODE_SIGNING_ALLOWED=NO. The background-only CI runner now applies a disposable ad-hoc simulator application identifier/Keychain group before installation and records its entitlements. This permits the real SecureStore/UI path without embedding credentials, changing production app permissions or replacing secure storage. It requires CI/GitHub Actions; the signed-device release identity remains separate. The next native background flow must establish whether this corrects the observed setup failure.
