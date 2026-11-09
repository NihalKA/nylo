# Native App Store screenshot proposal

This test-only lane generates five real Nylo native UI captures from ordinary local AppData. It does not change startup, ship a demo mode, contact an AI provider, or upload anything to App Store Connect. All answers and files are original human-authored illustrations, **not live AI output or evidence of a successful model request**. Keep that disclosure with the assets and in the reviewer handoff. “Example” titles remain visible in the app.

| Capture                     | Intended view                                  | Readiness evidence                                                                |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `store-01-inbox`            | Clean Chats inbox with three useful examples   | All three conversation rows visible                                               |
| `store-02-response`         | One short, readable morning-planning answer    | First and final answer paragraphs, selected model, keyboard hidden                |
| `store-03-model-picker`     | Focused in-chat model sheet                    | Sheet title and all three model choices visible; conversation-title editor absent |
| `store-04-memory`           | Writing partner’s saved preference             | Explicit local Save memory action, saved text and edit/forget controls visible    |
| `store-05-attachment-draft` | Workshop text file attached to an unsent draft | Exact composer text, file removal control, model, keyboard hidden                 |

The memory starts empty and is saved by an explicit UI action. This illustrates user-controlled agent memory; it does not demonstrate an AI-proposed tool call or cross-chat recall. The file is a small original text outline, with normal native blob storage. There are no customer images, copied assets, invented QA model names, error states, or long synthetic history. Existing original Nylo UI supplies the branding.

The NyloHQ label matches the existing provider preset and endpoint. `gpt-6-luna`, `gpt-6.1-sol`, and `gpt-6-astra` are illustrative user-configurable model IDs from the existing catalog context, not a claim of new discovery or current availability. The connection has no SecureStore key, credential ID, or seeded provider consent. The flow never taps Send, Discover, provider tests, or network actions. It does not enter Settings, expose credentials, or include a simulator build/version page.

## Root integration and one capture run

Review the uncommitted patch first. Only test fixtures, runner/workflow scenario handling, and this document change. Existing smoke/gallery/attachments fixtures, seed, assertions, checksums and provenance behavior are preserved. The new seed retains strict `GITHUB_ACTIONS=true`, disposable CoreSimulator application-path, existing-database, and nonempty-data refusal guards; it also refuses existing attachment blobs.

After root integrates the fixtures onto the intended main ref, root can dispatch **one** UI workflow run:

```sh
gh workflow run ios-ui.yml --ref main \
  -f source_run_id=42543975993 \
  -f scenario=store \
  -f refresh_js_bundle=false
```

The existing matrix expression assigns non-smoke scenarios a single `large` profile. The runner rejects `store` with another profile or refreshed JS. It downloads the successful main native validation artifact, boots a new disposable simulator, launches once to create SQLite, stops the app, seeds examples, then captures through Maestro using source-grounded selectors and single taps. No local native build or device interaction is required for preparing this patch.

Native run `42543975993` supplies the app source beginning `2517a7d`; fixture preparation starts from docs-only `c9002c2`. Preserve the resolved full SHAs in `source.txt`. The earlier matrix `42545994892`, gallery `42547833210`, and attachments `42547836294` are baseline provenance, not this capture run. Signed build 14 workflow `42550246288` is separate root-owned delivery work; simulator captures must not be described as signed-build-14 evidence or build assignment. No wait or Apple action belongs to this lane.

## Dimensions, export, and review

Apple’s public [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/) were fetched on 2026-11-09. They accept **1320 × 2868 portrait** for the large Dynamic Island iPhone class (including iPhone 16/17 Pro Max), accept PNG, and prohibit alpha/transparency. The large simulator output was previously verified at this resolution; the new lane independently requires every selected capture to be 8-bit RGB PNG at exactly 1320 × 2868, with no transparency chunk. It fails instead of resizing, compositing, or rewriting pixels. This confirms an accepted image class, not completeness of every device slot required by App Store Connect; root must check the current required slots before any eventual upload.

Download `iphone-ui-<new-run>-large` and retain the entire artifact. `store-manifest.json` lists the exact five capture paths, dimensions and SHA-256 hashes, disclosure, source/flow SHAs, run IDs, fixture hashes, native archive hash and JS bundle hash. `native-bundle-sha256.json` records every app bundle file. Diagnostics and `00-native-launch.png` are evidence only, not marketing candidates. If capture or format validation fails, the seed manifest stays pending; do not treat partial images as an approved set.

Export plan: copy only the five manifest-listed PNGs byte-for-byte into an ignored `artifacts/app-store-screenshots/export/` directory. Preserve their filenames and verify each exported SHA-256 against the manifest. Keep manifest/provenance beside the export. No captions, mock device frames, pixel edits, model-name replacement, alpha conversion, or resizing are proposed. If the native output is unsuitable, report the gap and recapture after review.

Root must visually review all five full-resolution PNGs and their corresponding accessibility/driver evidence for readable complete content, proper safe areas, unobscured controls, clean keyboard-free states, correct provider/model labels, and absence of OS banners, QA labels, customer data, secrets or version pages. The memory view and three-choice picker are source-grounded proposals and still need that first native framing review. Record selected/rejected files and reasons in a review copy of the manifest; `uploadApproved` remains false in this preparation. A successful JUnit result means the asset flow completed, not a full product test pass, numerical score, model capability proof, or Apple approval.

## Local preparation checks

Validate Bash syntax, both YAML documents, Python syntax, seed output against current `parseData`/attachment hydration, refusal guards, and the diff. The gallery helper remains byte-for-byte unchanged, so its default seed behavior is unchanged. Local harness evidence belongs under ignored `artifacts/app-store-screenshots/`. No new native capture is claimed until root runs and reviews the fresh lane. App Store upload, external accounts, contracts, rights, age/privacy declarations, and signed-build assignment remain outside this patch.
