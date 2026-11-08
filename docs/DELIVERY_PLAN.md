# Nylo: delivery and store launch plan

Status: approved 8 November 2026, amended to prioritize iOS publication. Android store launch is deferred until iOS is published and validated; do not purchase Google membership yet. Independent model scoring is required at each material milestone. See QUALITY.md and STATUS.md.

## 1. Outcome and approval contract

Ship a reliable, free iOS and Android app with ordinary chats and persistent personal agents, powered by users' own API keys. Deliver the source repository, reproducible CI, signed installable builds, beta distribution, a public support/privacy site, and submissions to Apple App Store and Google Play. Continue through review fixes and release when the stores permit it.

Approval of this plan authorizes implementation, routine dependency and design choices, migration of the prototype into this repository, repository creation/push under the user's connected GitHub identity, beta distribution, deployment of the support/reporting service, store submission, and public release after the gates below pass. Proposed repository visibility is PUBLIC. Approval includes publishing app source only after a secrets, ownership, and asset audit. No publication occurs during planning.

No repeated approval is needed for phases, ordinary fixes, or releases within this scope. Provide progress updates and continue available work when an external dependency is pending. Record decisions and evidence in the repo so work can resume across sessions. An approved plan enables autonomous work during active sessions and configured CI; it does not itself create a permanently running agent.

Ask only for an unavailable account/credential, a legally required account-holder action, a material scope change, or spending beyond the approved budget. Never invent business details or attestations. No paid hosting, paid build plan, domain purchase, or account charge is authorized by implication; proposed budget is zero recurring infrastructure spend, excluding developer memberships and user-funded API usage.

## 2. Starting point, verified by inspection

- This repository currently has a README and icon, one initial commit, and no configured Git remote.
- The previous prototype exists at `/Users/nihal/Documents/ChatGPT/nylohq/nylo-mobile`. Do not modify or delete that original during migration.
- Inspected source uses React Native, Expo, TypeScript, Expo Router, SQLite, SecureStore, and direct provider streaming. It already has chats, agents, memory tools, chat-to-agent conversion, and JSON backup/restore.
- SQLite currently stores the entire application as one JSON record. Requests abort when the application becomes inactive. Model IDs are entered manually; complete history is resent on each turn. Those are prototype constraints to address or explicitly bound.
- Existing test and simulator claims come from the transcript. Re-run checks and native builds before accepting them as current evidence. A JavaScript bundle export is not a signed native build or an installation test.
- The prototype's LICENSE credits Expo. Audit provenance and preserve required upstream notices; do not assume that file resolves ownership or licensing of every app asset and source file.

## 3. Constraints to resolve before substantial feature work

| Constraint | Consequence | Planned response |
| --- | --- | --- |
| Apple/Google accounts and signing are external dependencies | Code alone cannot publish | Start account readiness and signed build checks first; continue app work while verification is pending |
| BYOK has App Review uncertainty | API credentials may receive scrutiny under payment/access and third-party service rules | No paid unlocks, credit sales, or purchase links in v1; document BYOK honestly, inspect provider terms, and submit the smallest complete release candidate early. Do not claim advance approval |
| Apple minimum-functionality/copycat review | A generic branded clone may be rejected | Original Nylo design; demonstrate separate agent memory, conversion, persistence, and backup. Never market as an official ChatGPT/Grok product |
| Free execution is foreground execution | Closing/locking the phone can interrupt a response | Checkpoint partial results, show interrupted status, and offer an explicit retry. Never promise reliable unattended tasks |
| Native clients cannot keep shared embedded API secrets confidential | A bundled review or production key can be extracted | Ship no shared provider key. Users enter their own credentials; use an expiring, limited review credential through private review notes only if needed |
| Local storage can be lost; provider calls leave the device | “Local” does not mean offline AI or zero data sharing | Plain privacy explanation, provider-specific consent, export/import, delete-all, and documented retention/security limits |
| Google AI content policy requires in-app reporting | An email link or a local-only flag is insufficient for the planned release | Add a small HTTPS report endpoint and an in-app report form, with explicit preview/consent and no automatic chat upload |
| Arbitrary custom endpoints are not uniformly compatible or safe | Credentials, streaming, models, and tools can fail differently | HTTPS only in production; show exact destination; re-enter credentials after destination changes; reject credential-bearing redirects; maintain a tested protocol matrix |
| Store SDK deadlines change | A working binary can still be ineligible | Recheck at implementation and submission. Current official pages specify Xcode 26+/iOS 26 SDK and Android API 36 for new mobile submissions; verify actual build outputs |
| Public source is a real product decision | Source is visible and forkable | Public repository is the proposed default for free standard runners. Audit all content and choose the app license before first push; if public is declined, keep the same pipeline on private quotas |
| Human testing and review take elapsed time | “Build completed” cannot mean “store launched” | Track beta, review, and production separately; never report unperformed testing or fabricate testers |

If Apple rejects the basic BYOK business model, fix an implementation or explanation issue first when justified. An App Review appeal or a different monetization/account architecture is a separate decision if the rejection cannot be resolved within this scope. Do not hide functionality from review. Do not build a paid proxy backend speculatively.

## 4. Fixed v1 scope

### Chats

Create, reopen, search, rename, and delete local conversations. Stream formatted responses with selectable text, code blocks, copy, stop, and explicit retry. Persist drafts and partial responses. Select a provider/model without losing the conversation. Explain that switching providers sends the selected context to a different service and request consent before its first use.

### Agents

Create/edit a name, purpose, instructions, and default provider/model. Each agent owns multiple conversations and an isolated, inspectable memory list. Users can add, edit, and forget memories. Promote a chat into an agent through a review screen that shows the proposed instructions/context; do not silently ingest the entire chat as permanent memory.

Memory mutation must be enforced by application logic: model instructions alone cannot prove that a user authorized a change. Proposed tool memory changes require a clear user action before commit; direct memory editing remains immediate. Memory changes are visible and reversible. New conversations reuse only that agent's instructions and approved memories. Switching models preserves identity but cannot guarantee identical behavior.

### Connections and privacy

Support OpenAI Responses, Anthropic Messages, and an explicitly defined OpenAI-compatible Chat Completions adapter. Offer model discovery where the provider supports it, plus manual model IDs. Show whether a connection was actually tested and that connection tests can incur API costs. Allow text-only use when tool calling is unsupported.

Store user keys only in the platform secure store. Never put them in app source, SQLite, telemetry, issue reports, screenshots, or exported backups. Show the endpoint host and provider consent before transmission. Do not read keys from this computer's Codex or other applications. Reject plaintext HTTP in production and verify redirect behavior on both native transports.

Include key removal, conversation/agent deletion, delete-all, versioned backup/restore, recovery from failed imports, and local search. Backups exclude keys and are explicitly described as sensitive plaintext in v1; use the OS share sheet and clean up temporary exports. Validate limits and structure before replacing any data. Restore requires a concrete confirmation and a recoverable transaction.

No Nylo login, automatic device sync, analytics SDK, advertising, subscription, attachments, speech recording, browsing, code execution, notifications, scheduled jobs, arbitrary phone control, or local LLM in v1. The phone runs the application workflow; the selected provider runs inference. No reliable background-execution claim. No paid cloud-agent implementation yet.

## 5. Architecture and repository

Use React Native + Expo + TypeScript and Expo Router. Keep one application at repository root rather than introducing a monorepo for a single product. Pin an Expo-supported dependency set from the working prototype, verify compatibility and support, and upgrade only when a specific build, security, or store requirement justifies it. Use a lockfile and pinned Node/Ruby/Java/Xcode toolchains.

Suggested structure:

```text
app/                    screens and routing
src/domain/             chats, agents, memory, validation
src/providers/          explicit protocol adapters and stream parsers
src/storage/            SQLite migrations and secure-store interface
src/features/           reusable feature/UI logic
tests/                  unit, integration, provider fixture tests
e2e/                    native smoke flows and synthetic fixtures
fastlane/               native build, signing, and submission lanes
.github/workflows/      checks, native validation, beta, release
site/                   public landing, privacy, support, deletion help
services/reports/       minimal abuse-report intake only
docs/                   decisions, delivery status, release evidence
```

Keep domain/provider/storage interfaces separate from React screens. Use a versioned SQLite schema with chats, messages, agents, memories, connections, and drafts. Migrate the prototype's JSON state transactionally with fixture coverage and recoverability; persist streaming updates in bounded batches. Keep secure-store keys outside database migrations and backup files. Test restore/clear operations when keychain removal fails or credentials survive reinstall.

Provider adapters normalize text deltas, usage when supplied, completion, errors, and tool calls. Bound requests, output, tool iterations, retained context, and stored content. Distinguish rate limits, invalid credentials, unavailable models, network loss, context overflow, and cancellation. Retry only on a user action when duplicate model charges or repeated tools are possible. Do not claim token-level resumption.

Add visible context limits. Preserve full local history, but never silently send an unbounded transcript or silently summarize it with extra API charges. Start with a documented bounded context policy that preserves system instructions and coherent turns, displays when older messages are excluded, and offers a new conversation. Include output limits and provider-reported usage where available; do not present guessed prices as an exact bill.

Chat databases rely on platform storage protection in v1; they are not automatically encrypted with an application password. Explicitly configure/test Android backup exclusions and iOS file/backup protection. Document reinstall and device-backup behavior instead of promising every uninstall erases every credential.

## 6. CI/CD: builds on GitHub, no required Expo cloud subscription

Use standard GitHub-hosted macOS for iOS/Xcode and standard Ubuntu for Android/Gradle and JavaScript checks. There is no special Android runner requirement: install the Android SDK/emulator on Linux with hardware acceleration supported by the runner. Choose named runner images and compatible Xcode/SDKs during the first build spike; record them rather than relying blindly on `latest`.

Generate native projects through repeatable Expo prebuild/config plugins; keep custom native settings in versioned config/plugins. Build on the runner using Xcode/Gradle through Fastlane. This is an Expo app without requiring Expo-hosted build minutes. Do not build on EAS cloud and assume GitHub's free minutes cover Expo's bill. EAS local build is an optional alternative, not a second pipeline to maintain.

| Trigger | Automated jobs | Result |
| --- | --- | --- |
| Pull request | Install from lockfile; formatting/lint/type checks; domain/provider/storage tests; dependency/license/secret checks | Mergeable source with actionable failures |
| App/native changes on trusted branch | Android debug build + emulator smoke; iOS simulator build + smoke | Actual native compatibility evidence |
| Passing release candidate from main | Full gates; signed Android AAB and iOS IPA; upload same candidate to Play internal testing and TestFlight | Installable beta builds |
| Qualified release version/tag | Verify source, binary checksums, version/build numbers, beta evidence, metadata, account eligibility; submit/promote exact tested build | Store review and production release |

Do not release merely because a tag exists. Use immutable commit/build records, serialize production runs, avoid duplicate build numbers, and rerun only failed steps when safe. A binary change creates a new candidate and restarts relevant checks. Reuse the tested binary for release rather than rebuilding untested bytes.

Security for a public repo: PR jobs receive no production secrets; no secret-bearing `pull_request_target` execution of contributor code. Release only from trusted protected refs, use least-privilege permissions and commit-pinned third-party Actions, and isolate signing/upload jobs from untrusted checks. Use ephemeral macOS keychains and temporary credential files; clean them up and never upload them as artifacts. Dependency install scripts in signing jobs are trusted execution and must come from the reviewed lockfile.

Configure concurrency cancellation, job timeouts, caches without credentials, and short artifact retention. GitHub's free standard public-repo compute does not remove storage, concurrency, queue, service, or acceptable-use limits. Larger runners remain outside this zero-cost design. Never attach a personal persistent self-hosted runner to public untrusted PRs.

Use GitHub Pages for the static privacy/support site. Proposed report service is a minimal Cloudflare Worker with a private persistence/triage store on an available free tier, subject to actual account quotas. Keep it replaceable. Report form sends only a selected response, chosen reason, app/provider/model version and optional user-entered context after preview; no keys, full conversation, or silent background upload. Add server-side size validation, abuse/rate limits, retention deletion, a delivery acknowledgement, and an authenticated triage process. Failed reports remain retryable and are never described as submitted. If the service needs payment or has no available account, finish it locally and request only that missing prerequisite.

## 7. Implementation sequence and exit gates

### Phase 0 — establish the release path first

Audit/import the original app without dependencies, generated builds, personal data, or keys. Capture the baseline; run existing checks. Audit licensing and assets. Check GitHub identity/visibility, Apple and Google account type/permissions, available devices, SDKs, and proposed package ID `com.nylohq.nylo` before registering immutable identifiers. Confirm name availability; Nylo remains a working brand until checked.

Build a minimal native candidate on both runner platforms immediately. Exercise real TLS streaming and SecureStore on native devices/simulators. Confirm signing/upload permissions when credentials exist. Check provider client-use terms and official store policies. Create `docs/STATUS.md` with work, decisions, blockers, and next actions.

Exit: source is reproducible, native builds work, account blockers are identified, and no known fatal product constraint is being deferred. Missing signing access does not prevent unsigned builds or other work, but signed distribution cannot be claimed.

### Phase 1 — durable data and provider behavior

Implement transactional persistence/migrations, crash recovery, isolated memory, backup validation, secure key lifecycle, endpoint consent, bounded requests/context, and provider adapter tests. Add real-provider smoke tests only when separately supplied test keys are available; keep routine CI synthetic and secret-free.

Exit: saved chats/drafts/memory survive restart; malformed backups and failed migrations leave recoverable data; interruption/retry cannot corrupt history or repeat approved memory operations; actual provider text streaming works on both platforms.

### Phase 2 — finish the user experience and policy requirements

Complete Chats, Agents, conversion review, model setup, rich response rendering, search, accessible touch targets/labels, dynamic text, safe areas, keyboard behavior, dark/light theme, and loading/empty/error states. Add provider sharing consent, memory confirmations, delete-all, privacy/support screens, and report intake with triage.

Prefer a focused, original UI to new feature breadth. Restrict first release to phone layouts; disable advertised tablet support until it has been verified. Check what supported device families still require in store listings. No onboarding that promises future capabilities as present functionality.

Exit: all defined user journeys work, policy declarations match observed data flows, and no placeholder policy/support/report destination remains.

### Phase 3 — installable beta and early store review

Produce signed release candidates, install through TestFlight and Google Play internal testing, deploy public policy/support URLs, and prepare metadata/screenshots/review notes. If the account requires a closed test, start it as soon as a stable beta is ready. Confirm tester enrollment and collect genuine feedback; time and participation cannot be simulated.

Review access must be usable without reviewers purchasing API credits. Supply an approved, time-limited credential through private review notes where accepted; separately labeled offline sample content may demonstrate navigation but is not a substitute for reviewers testing live core functionality. No shared key in the app. Review access and its API budget are a release dependency.

Submit the smallest complete policy-ready v1 to Apple after required QA, so review risk is tested before optional polish. This is the same public product and functionality users receive.

Exit: beta installs work; current policy/minimum SDK checks pass; real test findings are fixed; the applicable Google closed-test period is complete before applying for production access. Apple submission/review may proceed independently of the Google wait.

### Phase 4 — production and recovery

Submit through Fastlane/App Store Connect and Google Play Developer APIs where supported. Upload binaries, metadata and screenshots; select the tested build; submit for review. Account creation, legal agreements, console-only policy questionnaires and verification may require the account holder or authenticated UI work. Automate supported operations without treating a binary upload as review submission.

After store approval and all launch gates, release automatically within the approved scope. Use a staged Google rollout when available. Apple phased releases apply to updates, so do not promise a phased first launch. For subsequent updates, use staged/phased rollout and pause on serious issues.

If rejected, classify the actual objection, fix within scope, test, and resubmit. Escalate only a fundamental business/legal/account decision. Native store releases cannot generally downgrade users instantly: halt rollout, remove availability when appropriate, and ship a fixed build with an increased version. Keep migrations backward-tolerant where feasible and user backups recoverable.

Exit: actual public store links, downloadable releases where appropriate, passing release evidence, deployed support/reporting, and documented support/credential-renewal responsibilities. A pending store review or unavailable credential means delivery is still externally blocked, not completed.

## 8. Required validation

- Unit/integration: fragmented Unicode/SSE, all supported provider protocols, unsupported tools, cancellation/timeouts, malformed output, bounded context, memory isolation/authorization, redaction, migrations, restore and deletion failures.
- Native automated journeys on both OSes: clean install, connection setup with synthetic transport, first chat, stop/retry, restart persistence, agent creation, new agent conversation, memory review, chat conversion, search, export/import, consent and reporting.
- Small native live-provider matrix: each claimed provider protocol must stream correctly on iOS and Android. Use limited test keys and bounded requests. Never spend customers' keys in CI.
- Release-build testing: install from beta tracks, keyboard and back navigation, long conversation rendering, background/lock/network interruption, low-storage/save failures, large text, screen reader navigation, dark mode, and upgrade from the preceding beta without data loss.
- At least one physical iPhone and one physical Android smoke pass before public production. Simulator-only evidence is labeled as such. If no device/tester access exists, continue everything else and hold production rather than claim a test happened.
- Privacy/policy: inspect outbound destinations and logs, credential redirect handling, backup exclusions, report consent and triage, no shipped keys, correct age rating/content declarations, privacy manifests/required-reason APIs, Android permissions and target SDK, encryption/export declarations based on actual implementation.
- Performance: seed a representative large history (for example 1,000 messages), verify responsive scrolling/startup and bounded persistence/memory, and define measured thresholds on the chosen devices before optimizing. Avoid a rewrite without evidence.

## 9. One-time owner prerequisites

Collect non-secret account details in one batch after approval; request actual secrets through secure credential input, never ordinary chat or committed files. Keep independent work moving. Do not repeatedly ask for credentials already supplied.

| Requirement | What is needed | Why it cannot be invented |
| --- | --- | --- |
| GitHub | Connected identity, right to create/push repository; public visibility accepted with this plan | Publishing source and setting repository permissions require account access |
| Apple | Active Developer Program membership, seller identity/team, account agreements; App Store Connect role/API key; distribution certificate/private key and provisioning profile or authority to generate them | Account holder controls identity, contracts, and signing |
| Google | Verified Play Console account, account type/creation eligibility; application record, service-account permissions; upload keystore with private backup | Verification and production access belong to the publisher |
| Store details | Publisher/legal name, support contact, launch countries, truthful age/content declarations and rights to brand/assets | Legal/policy answers must reflect the actual publisher |
| Reporting/site | Hosting access, private report triage owner, reachable support inbox, approved report retention | A report endpoint without someone responsible for triage is incomplete |
| QA/review | Access to real devices/testers; restricted provider test/review credentials and an explicit API-spend allowance | Tests, review access, and API spend require real resources |

Default launch language is English and category is Productivity, subject to actual content and console choices. Do not select countries requiring unresolved legal declarations automatically. Prefer organization enrollment if NyloHQ has an eligible legal entity; an individual's store seller identity may be public, and organization verification can take longer. Never create a false organization to avoid testing.

No end-user Nylo account means no account-deletion backend or Sign in with Apple flow in v1. Local data deletion remains required functionality. If accounts are introduced later, reassess store account-deletion/login requirements.

## 10. Costs and timing

Standard public-repository runner compute is currently free; it is sufficient for the proposed build pipeline if quotas/capacity permit. Membership fees remain: Apple lists USD 99 per year and Google lists a USD 25 one-time registration fee, with applicable local currency/taxes. Users pay their own AI provider charges. CI artifacts, reporting storage, optional domains, and provider review/test usage can still create cost; set no paid upgrades by default.

Sequence work by exit gates, not a promised calendar date. Initial account verification and review readiness are the critical path. A newly affected personal Google account requires at least 12 testers continuously opted in for at least 14 days before production access application, which itself may need approval. Store review, verification and real tester participation cannot be compressed by more build automation. Provide a narrower engineering estimate after Phase 0 verifies the prototype and runner builds.

## 11. Definition of done and ongoing operation

The project is finished when v1 is publicly available on both stores with reproducible tested source, protected signing credentials, CI/release records, truthful listings/privacy disclosures, functioning reporting/support, and a recovery runbook. Maintain an honest status for each platform separately.

Until then, continue every authorized unblocked step; surface the smallest specific external action needed when one remains. Do not stop at a demo, web export, APK, TestFlight upload, or “ready to submit.” Autonomous handling of a particular future rejection or expired credential requires an active agent session or an explicitly configured follow-up; GitHub CI handles the deterministic build/release pipeline.

After launch, document ownership of report triage, support, store agreements/membership renewals, signing expiration, policy/SDK deadlines, dependency updates and provider API changes. Add scheduled dependency checks and non-spending synthetic CI; real-provider checks require explicit budgets. No unattended spending or indefinite human support is implied.

## 12. Official references checked for this plan

- GitHub runner billing and limits: https://docs.github.com/en/actions/reference/runners/github-hosted-runners and https://docs.github.com/en/actions/concepts/billing-and-usage
- Expo native/local build options: https://docs.expo.dev/build-reference/local-builds/
- Expo store upload prerequisites, including current first Android submission support: https://docs.expo.dev/submit/android/ and https://docs.expo.dev/submit/ios/
- Fastlane build/review automation: https://docs.fastlane.tools/actions/appstore/ and https://docs.fastlane.tools/actions/app_store_connect_api_key/
- Apple review/privacy/payment/minimum functionality requirements: https://developer.apple.com/app-store/review/guidelines/
- Apple membership: https://developer.apple.com/help/account/membership/program-enrollment/
- Apple SDK requirements: https://developer.apple.com/news/upcoming-requirements/?id=04282026a
- Google registration: https://support.google.com/googleplay/android-developer/answer/6112435?hl=en
- Google testing eligibility: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Google AI content reporting: https://support.google.com/googleplay/android-developer/answer/13985936?hl=en
- Google target API requirements: https://developer.android.com/google/play/requirements/target-sdk

Recheck these at the corresponding implementation/release gate. Policy compliance and acceptance depend on the actual app, account and store decision; this plan is not a guarantee of approval.
