# Feature-branch Android build identity

The owner requested a fresh cache-free Android candidate and visible Settings
marker on 10 November 2026. This narrowly authorizes the marker and build-pipeline
work; it does not approve unresolved Figma layout gaps or change iOS delivery.

## Findings

- Shared checkout main was 86a57a8, equal to origin/main. Only unrelated owner
  package.json dashboard scripts, dashboard/ and output/ were uncommitted.
- Feature origin was eb4942a; its parent a1950d8 only adds Android tab insets to
  dcef4f6. The original Figma theme/artwork changes are already in dcef4f6.
- The previously supplied build13 link was not the feature candidate. Build14
  really used eb4942a and its Hermes bundle contains #F9F9F8/#1E2B58 plus all
  45 SVGs. Missing design assets/stale compilation is not the established cause
  of the owner's visual mismatch. Existing documented layout gaps remain.
- android.yml builds APK/AAB on Ubuntu, checks out the workflow event SHA,
  generates the untracked native project, and signs with the existing identity.
  Neither android/ nor ios/ is tracked. Previous setup-node caching stored npm
  downloads, not a compiled APK, Metro bundle or Gradle output. The three custom
  plugins modify iOS image/camera implementation only, not Android UI.
- android-ui.yml previously excluded feature source runs. Manual feature
  validation now accepts this branch, pins its fixtures to the exact source SHA,
  and revalidates the downloaded APK. Automatic workflow_run changes take effect
  only once present on the default branch; until then dispatch this workflow on
  the exact feature branch with the explicit successful native run ID.

## Fresh-build contract

Android compilation uses exact event-SHA checkout, no restored npm cache,
per-run npm/Gradle homes, expo prebuild --clean --platform android, and Gradle
clean --no-build-cache --rerun-tasks. Generated outputs are removed first.
Build identity is generated after checkout so the marker contains the actual
commit being compiled (a commit cannot contain its own SHA as a literal).
Only Android Settings displays EXPO_PUBLIC_UI_BUILD_MARKER.

The artifact includes full source SHA, UTC time, run ID/attempt and hashes of all
45 SVGs/12 runtime fonts. The verifier reads the actual APK ZIP/Hermes bundle,
requires the exact marker and theme strings, and checks every original asset's
bytes. Synthetic negative checks reject stale markers and omitted assets.
The gallery asserts the full visible marker and retains its screenshot in
addition to Settings, Create agent, Report and model picker. Gallery rendering
uses 1170px at 480dpi = 390dp width, font scale 1.0, with real system insets.

This evidence establishes binary identity and exercised screens, not complete
visual parity. No privacy, attachment, consent, provider or iOS/store behavior
is changed. Existing source/design review gates are not weakened.
