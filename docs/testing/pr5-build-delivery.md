# PR #5 build delivery

PR [#5](https://github.com/NihalKA/nylo/pull/5) merged to `main` at `e072335ff7369d289aece4ec5331f78b5b71478a`.

## Delivered binaries

- Android 1.0.0 (19): [signed APK](https://github.com/NihalKA/nylo/releases/download/android-beta-1.0.0-19/Nylo-test.apk), built by [42885771351](https://github.com/NihalKA/nylo/actions/runs/42885771351). APK SHA-256 `9351aa2e45a9e5c8c541174179804d0840f731eee5e14387851c548b2c3c3043`; AAB SHA-256 `ee7050dcc1df848e37d68fe352193f6bbf6542d4fc9ea4ed42cade69d2654547`. Artifact digest, archive and binary CRCs, original signing certificate, permissions and packaged source identity verified. Public APK size and digest match the verified file.
- iOS 1.0.0 (23): [signed build and upload](https://github.com/NihalKA/nylo/actions/runs/42885793645) succeeded. Actual exported IPA SHA-256 `90b34929cc1ebd8b97f95dff4f433e609a2fcdbab7cf92263a172fbf4e0b7f72`. Signature, distribution certificate, profile, bundle/source identity, packaged assets and privacy audit verified. Apple processing is `VALID`; independent readback confirms `IN_BETA_TESTING` in the existing internal Nylo Device QA group only. Installation has not been observed.

## Runtime verification

All tests below use the original merged app/native source. Later changes fix test targeting or CI infrastructure; no refreshed JavaScript bundle was substituted for native iOS verification.

- Standard iPhone: [42893166015, large profile](https://github.com/NihalKA/nylo/actions/runs/42893166015), 109 executed commands passed; 13 conditional commands skipped.
- Compact iPhone: [42904774714](https://github.com/NihalKA/nylo/actions/runs/42904774714), 111 executed commands passed; 12 conditional commands skipped.
- Maximum accessibility text: [42906181795](https://github.com/NihalKA/nylo/actions/runs/42906181795), 111 executed commands passed; 12 conditional commands skipped.
- Android gesture and three-button system navigation: [42915598316](https://github.com/NihalKA/nylo/actions/runs/42915598316), each mode passed 106 executed commands; 12 conditional commands skipped in each.

The iOS and Android captures and provenance were reviewed. Android final composer, attachment and model controls were also verified above the real system navigation bounds in both modes. Covered flows include provider setup navigation without a provider request, multiline drafts and restart restoration, attachment-menu cancellation, agent creation, saved-memory navigation and restoration, and an agent conversation draft.

Earlier failures remain in CI history. iOS fixture corrections address scrolling direction, oversized accessibility targets, impossible list centering and compact tab-icon targeting; the compact job also needed more than its original 20-minute allowance. Android emulator host core dumps confirmed `SIGSEGV` across two emulator versions; memory bounds and a graphics fallback did not resolve it. The successful run uses pinned emulator 36.6.11 with Mesa llvmpipe through Xvfb, Android API 35, and the same signed APK. No app-code change was needed to complete these smoke checks.

These results do not establish physical-device installation, live-provider behavior, VoiceOver/TalkBack acceptance, or complete Figma visual parity. Maximum text uses substantial wrapping and scrolling. Store and external-beta assignments were not changed.
