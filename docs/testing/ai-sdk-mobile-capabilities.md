# AI SDK mobile beta delivery

The feature remains on `feat/ai-sdk-mobile-capabilities`, unmerged in
[PR #6](https://github.com/NihalKA/nylo/pull/6), from main
`19c3c440acf4cf7f8089929ae5f4048f5aec4198`.
Both distributed binaries use app source
`199e62fa7670706ebedcf5ca8dbbc9439aae80a4`; later commits change tests/docs only.

## Delivery

- Android **1.0.0 / versionCode 27** is published:
  [download APK](https://github.com/NihalKA/nylo/releases/download/android-ai-sdk-beta-1.0.0-27/Nylo-test.apk).
  The public APK and published checksum were downloaded and match the audited binary.
- iOS **1.0.0 (27)** was built, uploaded and processed **VALID**.
  Assigned to the existing internal **Nylo Device QA** group. Fresh group/build
  reads confirm the exact build and **IN_BETA_TESTING**; English test notes
  were saved and independently read back.
  Actual TestFlight installation is unverified.

## What changed

Pinned AI SDK Core/provider packages run directly on the device using explicit
provider objects, the saved connection/key and Expo fetch. There is no additional
backend or implicit Vercel gateway. Nylo retains protocol/model choice, attachment
consent, memory approval and background-response policy.

- Configurable image generation and approved edits, persisted images, save/share.
- Web-search source links when the selected API supports the configured tool.
- Local response text/PDF exports.
- Explicit capability settings and verification after successful use; account
  access is not inferred from a model name. Generated pixels are not resent in
  ordinary follow-up messages.

The tool loop is bounded, automatic retries are disabled, malformed image
arguments are rejected before the image API, and requests stay on the selected
connection. Native edits use Expo files for multipart data. Native writes are
awaited before uploading, reading or sharing; temporary output is cleaned up.

## Verification

| Check                                      | Actual result                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Source CI `43114718126`                    | 105 tests, typecheck, formatting, security, fonts/assets and Expo Doctor pass              |
| Both-platform Hermes exports               | Pass                                                                                       |
| iOS simulator build `43114728155`          | Pass, source 199e62f                                                                       |
| Signed iOS build/upload `43114738391`      | Pass, 1.0.0 (27); actual signature/certificate/profile/source audits pass                  |
| iOS privacy                                | 12 manifests, required SDK declarations present, no microphone/tracking, exempt encryption |
| iOS SDK `43118369361`                      | Pass on unchanged native/JS source; all 3 captures inspected                               |
| iOS large/maximum-text smoke `43118374422` | Both pass; all 30 captures inspected                                                       |
| iOS compact smoke `43120342832`            | Pass; all 15 captures inspected                                                            |
| Android signed build `43114732905`         | Pass, versionCode 27; APK/AAB signatures, source, permissions and downloaded hash verified |
| Android SDK `43117443285`                  | Both navigation modes pass; all 6 captures inspected                                       |
| Android smoke `43117447966`                | Both modes pass; all 30 captures inspected                                                 |
| Android gallery `43113384909`              | Earlier build 26 UI baseline: both modes pass; all 28 captures inspected                   |

The offline native SDK scenario exercises actual Hermes streaming and tool
execution, generation/edit code with synthetic fetch, local text/PDF files,
rendered image persistence and cold reopen. It sends no provider request. One
computer integration case also generated a visually inspected image through the
actual SDK and selected NyloHQ connection; SDK web search returned source links.
These are distinct from a live mobile provider or physical-device test.

The Android gestural SDK job passed its single retry after the first screenshot
showed a Pixel Launcher ANR. The first compact iOS attempt missed its initial
accessibility state; the targeted test adds a bounded wait for the same state.
Maximum-text navigation scrolls an offscreen row into the tappable viewport;
exact draft/memory restoration assertions remain. No native rebuild was used for
test-only corrections. Builds 25/26 were superseded and not assigned to QA.

The temporary feature-branch signing-environment policy was removed after delivery;
both pre-existing policies were independently verified unchanged. Store build 15,
external build 17, unrelated testers/roles/signing, and the separate App Review
monitor were not changed by this task. The delivery continuation is disabled.

## Binary hashes

- APK SHA-256: `078f0ee0851366fe8e012ac42c6cdcb812264f4408f4e924e8acc43ea1cd730e`.
- IPA SHA-256: `11267ea94df7deb0e37b7f14331662875de2b41d186b3f168539d3a087068d67`.

Provider feature access depends on the configured API/model/account. Physical
installation, VoiceOver and live mobile provider use are unverified. Production
npm audit retains three moderate Expo transitive findings, with no high/critical
findings. Historical development receipts are retained in
[the development record](ai-sdk-mobile-capabilities-development.md); private Apple
receipts, logs and credentials are excluded from source/public releases.

## Follow-up: image edits and document creation (not released yet)

The reported live edit failure exposed an upload boundary missed by the original
synthetic fetch: Expo fetch rejects RN URI-only multipart parts. Native edits now
append the actual Expo File. A regression executes the installed Expo encoder,
reproduces the old rejection, and sends the corrected bytes to a temporary local
HTTP server for multipart parsing. The native offline diagnostic now runs that
encoder too, checking the image bytes, filename and MIME header without a
provider request. The generic error no longer assumes access or quota failure.

The owner also requested a model-callable PDF/text creation tool. create_document
creates a real local file, persists it in existing blob storage, displays a file
card and supports save/share. PDF formatting supports headings, lists and simple
tables, with escaped HTML and no external assets. Generation is bounded to two
documents per turn with validated content/filename limits. Other document formats
are not enabled by this change. Manual answer exports remain available.

The expanded SDK scenario creates image/PDF/TXT results, cold-reopens them, and
exports only its known synthetic sample PDF/text from the disposable CI database
for rendering/content inspection. No raw database is published. These follow-up
changes are pending native verification and a new beta; build 27 is unchanged.
