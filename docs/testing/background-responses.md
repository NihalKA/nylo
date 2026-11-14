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

## Inspected fresh matrix and signing diagnostic

Matrix42596718202 uses native/JS872837a from42592315108 with refreshfalse. All42flow captures, commands, provenance and recorded fixture hashes were inspected: compact96, large94 and maximum-text102 completed commands; each has11conditional skips and no failures. Draft cold restoration, saved memory and keyboard/agent composition complete. Maximum-text density/clipping remains an existing craft limitation. Evidence: `artifacts/background-current-matrix/verification.json`. The current actual compiled audit also passes11privacy manifests, required SDK manifest, camera purpose and no microphone/tracking (`artifacts/background-native-872`).

Background42598451280 did not reach UI: after the disposable ad-hoc Keychain signature, SpringBoard denied launch. It establishes no generation or background result. The subsequent diagnostic42599425899 preserves original signature/entitlements and simulator OS launch/crash logs before shutdown, including failures before server startup. Inspect its actual denial before prescribing another signing change. No signed17 or background pass is claimed at this checkpoint.

## OS signing diagnosis and existing-identity correction

Diagnostic42599425899 retains a real crash report: SIGKILL (Code Signature Invalid), termination namespace CODESIGNING, `Taskgated Invalid Signature`. It occurred before app startup with the temporary ad-hoc Keychain entitlements; it is not a background-stream result. Evidence: `artifacts/background-signing-diagnostic`.

The background-only UI lane now prepares the existing Nylo Apple certificate/profile in a disposable protected keychain, validates the exact app/team/profile/certificate relationship and validity, then signs the simulator with its app-specific Keychain group and DER entitlements. No new certificate or key is created. Credentials are scoped to the preparation step, never passed to the local mock server; the keychain/material is removed by an always-run cleanup. Trusted main CI and the exact downloaded simulator bundle are required. Other scenarios do not receive signing secret values. This still is simulator evidence, not a device IPA or TestFlight candidate. Actual launch, credential saving and background acceptance must pass before delivery.

## Correct simulator build path — supersedes post-build signing attempts

Run42601424241 corrected the keychain search-list error and produced a valid Apple Distribution signature, but the app still never launched. Run42602148094 retained the missing macOS host evidence: taskgated disallowed Nylo because no eligible provisioning profile was found, and amfid explicitly rejected restricted entitlements (`No matching profile found`). Nested signature verification passed. These are simulator setup failures, not successful background requests. Evidence: `artifacts/background-search-list` and `artifacts/background-host-denial`.

The [Apple build rules documentation](https://github.com/bazelbuild/rules_apple/blob/main/doc/common_info.md#codesign-bundles-for-the-simulator) describes simulator entitlements as a linked Mach-O section, with ordinary ad-hoc simulator signing. Adding device entitlements after an unsigned compilation does not reproduce that build path. The simulator build now enables Xcode signing with identity `-`, the existing public team identifier and base entitlement injection. A compiled audit requires the linked entitlement section and exact Xcode-generated simulated application identifier. This changes only the simulator build script; production app configuration and device signing are unchanged.

The post-build signing helper and UI workflow's release-environment/secret access are removed. No new certificate was created; prior disposable keychains were cleaned successfully. A new full native compilation and fresh UI/background evidence are required. Retain the existing42-image matrix as historical872 evidence, not proof of this new simulator build configuration. Real SecureStore saving and the unchanged owned-localhost background assertions remain mandatory.

## Linked-entitlement native build inspected

Native42603124329 at439c70e succeeds. Actual artifact13667133799 was inspected: the executable load commands contain `__TEXT,__entitlements`; Xcode's generated simulated plist contains exactly `Q59Q74QTG6.com.nylohq.nylo`; the compiled privacy audit has eleven manifests, the required image SDK declaration, camera purpose and no microphone/tracking. The original launch PNG shows the rendered Chats screen. Evidence and individual file hashes: `artifacts/background-linked-native-439/verification.json`.

The automatic fresh three-profile matrix42606212969 and the single owned-localhost background42606475612 are running on native/JS/fixtures439, refreshfalse. No re-signing, device profile, signing key or real provider is used by these UI jobs. Compilation and launch alone do not establish the background feature; its original Home/persistence/memory/Stop/request-count assertions remain pending. TestFlight17 has not been dispatched or delivered.

## Fresh profiles and first background completion

On native439, matrix42606212969 passes large94 and maximum-text102 commands (each11conditional skips). Compact stopped after18commands because the actual provider screenshot shows Apple's Intelligence notification covering Go back; the next PNG/AX shows iOS Settings. A targeted compact retry42607848507, with a notification-absence wait and every original assertion retained, passes97commands/11skips. The wait took865ms, so this does not establish that it causally fixed the transient notification. All42successful captures, source/fixture hashes, commands, archive CRC and GitHub digests were inspected. Evidence: `artifacts/background-linked-matrix/verification.json`. The original matrix remains FAILURE; passed profiles were preserved.

Background42606475612 reached normal secure key saving, then an OS Save Password prompt obscured the tab navigation. The fixture declines the owned dummy token with Not Now, with a captured-screen fallback for this large-profile system sheet's missing AX children. The app already disables autocomplete; no speculative product change was made. Assertions still require the actual Chats tab and original conversation before any send.

Run42608671833 then established one short stream durably completed while Nylo was on Home. Actual Home PNG, server timestamps (`home_gate_entered < final_output_sent <= durable_while_home`), exact stored answer and one balanced native begin/end pair were inspected. It stopped afterward because the fixture used default `launchApp`, which cold-started Nylo into the inbox; the completed answer is visible in that actual inbox PNG/AX. Evidence: `artifacts/background-linked-flow-second/partial-verification.json`. Memory, Stop and final restart were unreached, so this is not full feature acceptance.

Per the [Maestro launch reference](https://docs.maestro.dev/reference/commands-available/launchapp), the two app-switch returns now use `stopApp:false`. The separate explicit stop/cold launch remains unchanged, as do all response, memory, request-count, storage and cleanup checks. Corrected background42610607975 is running on the original linked439 runtime with refreshedfalse. No TestFlight17 upload or delivery is claimed yet.

## Full native background acceptance inspected — 9 November 2026

Background42610607975 passes59completed commands with one conditional skip on native/JS439, fixturesaae6, refreshfalse. All seven PNGs were inspected, including full-resolution completed reply, foreground memory interruption and Stop; Home and exact cold-restored completion are visible. Original screenshots include the actual system Passwords prompt and its negative dismissal.

Independent reconciliation in `artifacts/background-linked-flow-passed/verification.json` verifies recorded fixture hashes against Git, archive CRC/GitHub digest, source provenance and the SQL receipt. The server records exactly three owned requests (background, memory, Stop). Both Home branches satisfy `home_gate_entered < final_output_sent <= durable_while_home`. The first answer completes durably while Home; the memory request becomes interrupted without saving a fact. Foreground Stop persists; cold restoration is exact. Actual native logs contain three begins at active1 and three ends at active0, all before the final cold restart. There were no real provider calls.

Together with the fully inspected fresh three-profile smoke evidence, this clears the simulator prerequisites for the next narrow internal device-validation beta. It does not certify physical iPhone grants, screen lock, native expiration, repeated resource-pressure/force-quit behavior, VoiceOver, live providers, design95 or App Review approval. Signed IPA audit, Apple processing and exact internal QA assignment are separate remaining delivery gates.

## Internal TestFlight delivery verified

Signed workflow42612628652/sourcee452a2d exported and uploaded1.0.0 (17). The retained actual IPA audit confirms the bundle/version/build/family1, eleven privacy manifests, required image SDK, camera purpose, no microphone/tracking and exempt encryption. Apple reports build `4e6626be-2598-4c2e-a7ae-72e9b628ff51` VALID. English notes were saved/read back, internal Nylo Device QA assignment returned204, and independent group/build-state reads confirm exact17 and IN_BETA_TESTING. Evidence: `artifacts/signed-17-audit/qa-assignment-verification.json`.

This clears internal delivery, not physical-device or production acceptance. Original storebuild15 remains selected and WAITING_FOR_REVIEW, independently read after assignment at12:17UTC. The30-minute delivery task is disabled; the separate App Review/external-invitation monitor remains enabled.

## Android protection and lifecycle repair (November 2026)

Android previously never loaded a native response lease: its platform selector
returned `null`, and the local module registered only for Apple. Going Home
therefore deterministically interrupted an otherwise healthy Android response.
Standalone Android builds now register `NyloBackgroundResponse` and protect
already initiated requests with a non-exported `dataSync` foreground service.
The service posts an in-progress notification (Android notification visibility
still follows the user's system settings) and holds a bounded partial wake lock.
It stops after the last response completes/cancels, never restarts a killed
request, and has a ten-minute native per-response deadline as well as Android's
OS timeout handling. Concurrent responses own separate tokens; stopping one
cannot release another's protection. No boot receiver, background scheduling,
provider migration, additional generation request, or automatic retry is added.

Native startup can overlap a Home gesture. The store now waits for the actual
lease result before cancelling; a denied grant in the background preserves the
unsent draft. A late iOS expiration after returning to the foreground revokes
background eligibility without cancelling the foreground reply. Actual OS
expiration while backgrounded still interrupts and keeps checkpointed files and
text. iOS retains its finite UIKit budget; force quit, resource pressure, battery
restrictions and OS suspension can still interrupt work.

Source regressions reproduce three failures on the original implementation:
Android native selection, Home during acquisition, and late foreground expiry.
They pass with this change, along with background completion, no-replay,
checkpoint preservation and denied-startup coverage. Native Android lease tests
cover cancellation before service startup, independent concurrent ownership,
stale/duplicate events and expiry before a grant. Native compilation and actual
runtime acceptance must be recorded separately from these source checks.

Settings now shows only version and native build number. CI's source marker
remains in a private build-info property inside both production Hermes bundles;
it is not rendered by the product UI. Gallery checks now inspect the version
footer and absence of the old marker rather than requiring diagnostic text.

## Background repair candidate delivery — 14 November 2026

[Android 1.0.0 (45) CI](https://github.com/NihalKA/nylo/actions/runs/43564085672)
passed at source `c1d1cf1ff5110b0cdd23176db15e2a9a0a3c68a3`. The original
APK/AAB archive digest and CRC, compiled source marker and 57 assets, original
signer, foreground-service manifest and four native lease tests were verified.
The AAB SHA256 is `dbd5fe586205bdfbf425e30c6dfc63e3d95dff563a2e5d2623199d42e309f09d`.
This exact bundle remains ready for the existing Play closed Alpha track; it has
not been uploaded or submitted for review because the signed-in Chrome
Computer Use bridge reports an unavailable browser host. Existing build 42
remains the available Play release. No replacement build is needed.

[Signed iOS 1.0.0 (43) CI](https://github.com/NihalKA/nylo/actions/runs/43572299470)
passed at source `9a5587b8f8b777b41e679dda3479e475e1b30fff`. The exact diagnostics
archive digest/CRC and original exported IPA audit receipts verified the source,
build, original distribution signer, strict signature, embedded App Store
profile, privacy declarations, 12 fonts and 57 assets. The IPA SHA256 is
`7cb417b2e3b516ec4425102dbe4a04fe0ad26a85676c38872be3b076aed57415`.
Apple reports build 43 `VALID`; independent readbacks confirm its selection in
the existing internal QA and public TestFlight groups and both states
`IN_BETA_TESTING`. Release notes were saved and read back; prior build selections,
group attributes and internal tester membership were preserved. The existing
public TestFlight link is https://testflight.apple.com/join/u7zsCTuR. Installation
and physical background/lock-screen behavior have not been observed.

The iOS simulator workflow numbered 81 contains app version 1.0.0 (1), not build 81. Its source/package/assets were verified, but no new runtime acceptance pass
is claimed. Source tests and signing receipts do not establish physical-device
background duration. No real provider request was made for this delivery.

Both original candidate binaries are retained. Temporary feature-branch CI
workflow gates and only this task's Apple environment branch policy were removed
after CI completed; other policies remain intact. These cleanup/documentation
changes do not alter the app inputs and require no native rebuild. Merge remains
blocked until the owner explicitly confirms the delivered builds are good.

## Settings build-number follow-up

The owner observed that installed iOS 43 showed only `Version 1.0.0`. The footer
read `nativeBuildVersion` from `expo-constants`, which does not supply that field
in SDK 58. It now reads the installed native version and build from the
SDK-compatible `expo-application` module, so the footer renders
`Version 1.0.0 (<installed build>)` on both native platforms. No number is
hardcoded. Web keeps its configured version without inventing a native build.
Three regression cases cover iOS, Android and web; all 177 tests and type
checking pass. Existing distributed binaries are unchanged; new CI candidates
are required for this correction. The exact branch workflow allowances are
temporarily restored only for those candidate builds and must be removed again
after CI completes.

The owner subsequently authorized completing this follow-up on the same branch,
merging to main and publishing both corrected candidates to the existing
TestFlight and closed Alpha destinations. That instruction supersedes the
earlier hold on merging pending owner acceptance.
