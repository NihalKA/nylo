# Native App Store screenshots

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

## Native capture review — 2026-11-09

**PASS for asset preparation only.** The preparation instructions above are now followed by actual capture evidence: root's single [store run 42551583436](https://github.com/NihalKA/nylo/actions/runs/42551583436) completed successfully. The entire run artifact set is retained under ignored `artifacts/app-store-screenshots/native-capture/`, including eligibility, five original captures, driver commands/logs, JUnit, launch diagnostic and unchanged capture manifest. No additional dispatch or native build was made during this review.

Provenance independently checked against the downloaded successful native artifact from run `42543975993`:

- Native/JS source: `2517a7d82f93f2e565d0adf6a7e1d4901026c152`; flow/fixture source: `1a741e2a0aa264f6e9bfa734048cae8ffe1304cf`; `refresh_js_bundle=false`, `scenario=store`, single `large` profile; iPhone 17 Pro Max, iOS 26.2.
- Native archive SHA-256: `3d52180ba148a3578e7f6a6714afe150af7323ba9d377e16cde1b0b378b927bd`. All **177/177** bundle-file hashes independently match the actual downloaded ZIP, including JS `510e7297aa3e34d2f7ba72010694e06211fddab57c401869b60553b6112471fe`. All four fixture/source-file hashes match their flow commit. Native source artifact retained under ignored `artifacts/app-store-screenshots/native-source/`.
- JUnit: **1 asset flow, 0 failures**. Driver: **54/54 COMPLETED records**, comprising 52 flow commands plus two configuration records: 24 assertions/waits, 13 taps, three visibility-scroll commands, five animation waits, five screenshots, one launch and one text input. No Send, Discover, provider test or Settings action occurs. Driver logs include AX selector/bounds evidence; no separate complete AX tree dump is present.
- Each of the five unique PNGs independently passes signature/IHDR, exact **1320 × 2868**, 8-bit RGB, no alpha or `tRNS`, PNG chunk CRC and manifest SHA-256 checks. All five were inspected at original resolution with corresponding driver evidence. No OS banner, keyboard, QA label, secret, error or version page appears. These are native captures without pixel rewriting, HTML mockups or signed-build byte-identity claims.

| Selected root-review candidate (under `artifacts/app-store-screenshots/export/`) | Visual finding | Export SHA-256 |
| --- | --- | --- |
| `store-01-inbox.png` | All three Example rows complete; normal list-preview ellipses; safe navigation. | `293f431ab400b9bb7976d33f66801677af408ac0ff17a864162b8f7b3d877d2f` |
| `store-02-response.png` | Example title, full prompt and answer including final paragraph, model and composer readable. | `f681f18678b93c901d5e17d2c041c91bc99ce2622f9ffcde031512e3640f6283` |
| `store-03-model-picker.png` | Complete native sheet, NyloHQ and all three exact model IDs, selection check, close, context notice and Manage providers visible. | `477fc594e07591785721fca865161da4e69e55b61937cf5ceec7a141d6e62dcc` |
| `store-04-memory.png` | Example agent, Memory tab, cleared New memory field, disabled Save memory after save, complete saved fact/date and edit/forget controls visible. Recent chats is off. | `12ae9bf6667e09eae69b911fb265af4d68384e5a6b0d5ffa5d4e179637be9479` |
| `store-05-attachment-draft.png` | Complete file/removal control, exact unsent composer text and model; native New chat title and empty-state whitespace. | `5badbcd14e738667de54f1ebe942bdd0f6a4232f264ea06cba1ee0dffd2309da` |

All five exports are byte-for-byte copies of the manifest-listed originals, with hashes rechecked. The separate ignored `artifacts/app-store-screenshots/review-manifest.json` records selected/rejected candidates, reasons, evidence and caveats; a copy and original provenance files accompany the exports. The capture manifest remains unchanged, SHA-256 `ebe6c5824aa48b6ba4ceee3571e49e9cb05e7d2da67b808488a2df7e7e47be56`. The pre-seed `00-native-launch.png` is rejected as a marketing candidate; driver/launch diagnostics are evidence only. `uploadApproved` was **false** at the independent capture-review checkpoint; the subsequent root decision and completed upload are recorded below.

Framing notes for root's final selection: Memory's lower context-help paragraph continues below the natural scroll viewport, while the saved fact and controls are fully visible. No selector/readiness fix is needed for the intended capture. The attachment draft uses the native **New chat** header rather than its inbox Example title; its complete file and unsent text remain visible. Keep the human-authored illustrative-content disclosure with the handoff. Example labels are visible in the inbox, response, picker background and Memory view; the draft contains no assistant answer. Model IDs are configured examples, with current catalog availability and live API performance unverified. The explicit local memory save demonstrates neither an AI tool call nor cross-chat recall.

Root's next action is final asset selection and checking currently required device slots, followed by root-owned draft upload if appropriate. Legal/privacy/age declarations, review access, support facts and final approval remain root-owned. No App Store upload or Apple action was performed. This simulator evidence does not establish signed-build-14 byte identity, a new product score, full test-suite coverage, live AI success or Apple approval. Signed 1.0.0 (14) delivery and earlier matrix/gallery/attachment passes remain separate recorded evidence; no score is assigned to 14 here. Only this report is changed in tracked files; review and export artifacts remain ignored and uncommitted.

## Final selection and completed draft upload — 9 November 2026

Root reviewed all five original-resolution candidates, selected them for the English draft, and approved only the asset upload. The review manifest now records `uploadApproved=true` with that limited scope; the original capture manifest is unchanged.

The saved screenshot set is `586a3e17-ab4c-442d-ab05-055c4e558d46`, display type `APP_IPHONE_67`. Apple accepted all five original 1320 × 2868 PNGs. This is the API's display-type identifier for the accepted slot; no invented `APP_IPHONE_69` value or resized images were used. The signed app is iPhone-only; no iPad screenshots are claimed.

| Order | Native export | Apple asset ID | Bytes |
| --- | --- | --- | ---: |
| 1 | `store-02-response.png` | `03400019-73b7-892b-8018-b2d749fcbf71` | 186319 |
| 2 | `store-04-memory.png` | `65c00019-73b7-892b-8009-14aaf4e5fdd6` | 237839 |
| 3 | `store-03-model-picker.png` | `34000019-73b7-892b-8003-138eec45fad2` | 224042 |
| 4 | `store-01-inbox.png` | `c4800019-73b7-892b-8002-952f1ada7051` | 213423 |
| 5 | `store-05-attachment-draft.png` | `8e000019-73b7-892b-8010-52ca0a0853ac` | 135227 |

Upload read-back verifies **COMPLETE** for every asset, no errors or warnings, exact source MD5 checksums, dimensions, sizes and relationship order. A fresh subsequent GET independently confirms all five COMPLETE states and the same order/sizes. Sanitized evidence is retained in ignored `artifacts/app-store-screenshots/apple-upload-verification.json`; no presigned upload URLs or credentials belong in public documentation.

These are illustrative local examples rendered by the actual native app. They establish asset preparation and delivery, not live generation, cross-chat recall, signed-binary identity, a new quality score or Apple review approval. Version 1.0.0 remains `PREPARE_FOR_SUBMISSION` with no store build associated. No review was submitted and nothing was released.


## Candidate 15 refresh in progress

The grouped picker in app289fa04 supersedes the older picker asset above. A fresh store capture will use native run42563645051 with refresh false, original full-resolution PNGs and the same guarded local illustration flow. The illustrative default model is now gpt-5.6-luna, whose catalog presence and source-adapter text/PDF/image path were actually checked under a separate bounded authorization. The store lane itself still has no key and makes no provider request. Other configured model IDs remain examples, not verified capabilities. New files require actual native capture, full-resolution review and upload/read-back before the saved screenshot set is called current.
