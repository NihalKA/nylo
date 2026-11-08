# Native UI test reliability

8 November 2026. UI validation must identify its real native/JavaScript/fixture sources and retain meaningful acceptance checks. A successful eligibility check, source test or native compilation is not a UI pass.

## Automatic run eligibility

An Ubuntu eligibility job checks the completed native run against a pinned snapshot of current main before allocating the Mac matrix:

| Trigger/state | Decision |
| --- | --- |
| Successful same-repository native run; app/build inputs match current main | Run smoke using that native binary and the latest compatible fixtures, pinned to the eligibility snapshot. No JS refresh is implied. |
| Current main changed app/src, native package/config/assets/plugins or other relevant build inputs | Skip automatic UI jobs; record `skipped_stale_auto` and the changed paths. No UI tests ran. Wait for a current native build or use an explicitly compatible manual run. |
| Documentation, test cases or UI-runner changes only | Allow the latest fixtures against the identical app/runtime. Fixture and native commits remain separately recorded. |
| Explicit manual dispatch | Preserve the requested workflow commit and source-run choice; the UI runner validates the native source and accurately records whether JS was refreshed. |
| Failed, cancelled or foreign native run | Existing workflow conditions prevent automatic UI validation. |

The gate compares app, src, assets, plugins, config, tracked native directories, Expo/package/TypeScript/Metro/Babel configuration, Node version, native build/audit inputs and the native-build workflow. The UI workflow itself is a fixture/runner input and does not invalidate the binary. This is intentionally more than comparing commit IDs: documentation drift must not block a valid runtime, while a plugin-only native packaging change must not reuse a known older binary.

`ui-eligibility-<run>` contains `decision.json` and, for automatic runs, `runtime-drift.txt`. The job summary states the decision, reason, native source and fixture source. The workflow name identifies the native run. **A skipped automatic run produces no `iphone-ui-*` artifacts or Maestro `results.xml`; it must never be credited as passing smoke.** GitHub may still show the completed eligibility-only workflow as green because its gate ran successfully. Check the UI jobs and artifacts, not that aggregate indicator.

The pinned eligibility snapshot prevents the workflow from silently changing fixtures halfway through a run. A newer main commit arriving after eligibility does not retroactively turn that historical result into current-candidate evidence; compare the recorded sources again for release decisions.

Manual JS refresh retains its strict package/config/asset guard and also compares local native plugins, config and tracked native directories. It cannot refresh across the image-SDK/privacy packaging change at e7ec9e0. Use the new successful native run for that candidate.

## Diagnosed recent failures

- Matrix42505181657: compact and large completed successfully; maximum text failed locating `agent-memory-input`. Actual PNG/AX showed the Memory editor below expanded content. This is a product-layout finding, addressed by the root implementation owner, not justification to reduce visibility or add repeated taps.
- Gallery42505184582: the report PNG showed a first-run Apple Intelligence banner over the header back control; the recorded tap at42,90 was followed by Settings’ Siri screen. The fixture now uses a native edge-back below the banner and asserts the expected chat route before final Copy. Exact complete clipboard equality remains required.
- Picker42506116267: source-action screenshots preceded presentation. The first Cancel returned from Photos, but Files’ Cancel was tapped while its AX frame was only1point wide atx340; the settled failure AX placed it atx380–416 and the Files picker remained open. The fixture waits for presenter anchors and animation settling before capture and one cancellation tap. Returning to the chat remains an explicit assertion.

The original picker captures showed the underlying chat, so they do not ground a photo-grid selection target. Obtain a settled picker capture/AX before adding selection; do not guess coordinates. Actual camera capture and physical-device permission behavior remain separate gates.

## Evidence rules

- Keep single-tap keyboard dismissal (`retryIfNoChange:false`), full-visibility scrolling, exact clipboard equality and storage checks. An animation wait is not permission to retry a broken interaction until it passes.
- Require positive content/route checks before screenshots; a negative assertion alone can succeed on an empty transition frame.
- Model search/filter selection and report-excerpt opt-in/off checks use stable input IDs and retained complete visibility where applicable. Screenshot the actual shared-context text, not only its disclosure button.
- `source.txt` is written before artifact download/boot/driver startup, records the true JS commit for unrefreshed binaries, and distinguishes native and fixture commits. Fixture/bundle hashes plus `phase.txt`/`execution.txt` make startup failures diagnosable without misclassifying them as app failures.
- Inspect actual current PNG, AX, commands, JUnit and source records before changing selectors or app behavior. Synthetic local fixtures do not prove live provider understanding or physical-device behavior.

## Guard validation

Bash syntax and YAML parsing pass. Read-only comparisons of existing repository history confirm:

- e7ec9e0 against itself: eligible.
- 6470912→9782e97 (documentation/fixtures only): eligible.
- 6830557→e7ec9e0 (10 relevant app/native inputs changed): stale automatic UI skipped.
- 6470912→c16471e (22 relevant app inputs changed): stale automatic UI skipped.

These checks validate the source relevance predicate, not the full GitHub workflow or native UI. The committed gate and new native candidate still need real CI execution before distribution claims.
