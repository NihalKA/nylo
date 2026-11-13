<p align="center">
  <img src="assets/brand/mark.png" alt="Nylo logo" width="140" />
</p>

<h1 align="center">Nylo</h1>

<p align="center">
  A calm, private chat app for <strong>your own</strong> AI providers.<br />
  Chats keep conversations together. Agents add their own instructions and memory you can edit.
</p>

<p align="center">
  iOS · Android · React Native + Expo · TypeScript · No backend, no account, no tracking
</p>

---

## Contents

- [What Nylo is](#what-nylo-is)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Connect an AI provider](#connect-an-ai-provider)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Regenerating assets](#regenerating-assets)
- [Scripts](#scripts)
- [Testing](#testing)
- [CI and releases](#ci-and-releases)
- [Privacy and data](#privacy-and-data)
- [Known limitations](#known-limitations)
- [Documentation index](#documentation-index)
- [Support and license](#support-and-license)

---

## What Nylo is

Nylo is a mobile chat client that talks **directly** from your phone to the AI provider you choose, using your own API key. Nylo has no server in between. Conversations, agents and memories live on your device until you send them to your provider or export a backup yourself.

The app is iOS-first. Android shares the same codebase.

## Features

### Chats

- Independent conversations with saved history, drafts and attachments.
- Search across titles, drafts, agent names and message text.
- Copy, report, retry, rename and delete. Each conversation can use a different model.
- A searchable model picker, grouped by saved connection.

### Agents

- Each agent has its own name, purpose, instructions, working approach (direct / plan / coach), default connection and **separate persistent memory**.
- Memory is something you can see and edit. Facts the model proposes need your approval before they are saved. You can add, edit and delete facts in the Memory screen.
- Optional **recent-chat context**: bounded text from up to 8 earlier conversations with the same agent. It is off unless you turn it on, and it never includes personal chats or chats with other agents.
- Start an agent from an existing chat, or from a starter role.

### Providers and models

- **OpenAI** (Responses API), **Claude** (Anthropic Messages API) and **any OpenAI-compatible** endpoint (Chat Completions).
- Save a model library per connection (up to 500 model IDs, with "select all"), set a default, and switch models per chat.
- Streaming replies, cancellation, and retry (a retry is a new request).

### Attachments

- Up to **4 files** per message: 2 MB each, 4 MB in total.
- Photos (re-encoded to JPEG, which removes EXIF data), the camera, PDF, and TXT / Markdown / CSV / JSON.
- Picking a file uploads nothing. Each send that includes attachments asks for permission to share them with the named provider.

### Look and feel

- **Light, Dark and System** appearance (Settings → Appearance).
- A "Fresh" palette with a brighter blue accent, raised cards and a time-of-day aura behind the headers.
- Motion: press feedback, a send button that springs in, a "thinking" orb while you wait for a reply, a streaming caret, and messages that fade in. Every animation respects **Reduce Motion**.
- **Haptics and sounds**: each kind of action has its own tactile feel, with a matching soft tone. You can turn each off in Settings → Sound & touch.
- **Brand**: the Nylo infinity-bubble logo and its teal → blue → violet → pink ribbon, used as light accents.

### Other

- **Live device check** (Settings → Advanced): an opt-in, on-device check of replies, memory and persistence.
- **Report a response** opens a pre-filled email. Nothing is sent until you send it from your mail app.
- **Backup / restore / delete all** local data.

## Tech stack

| Area                   | Choice                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Framework              | React Native 0.88, Expo SDK 58, Expo Router                                                               |
| Language               | TypeScript (strict)                                                                                       |
| Storage                | `expo-sqlite` (app state and attachment blobs), `expo-secure-store` (API keys)                            |
| Media                  | `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `expo-document-picker`                       |
| Feel                   | `expo-haptics`, `expo-audio`, React Native `Animated` (native driver), native `backgroundImage` gradients |
| Theming                | `src/theme.tsx` plus `expo-system-ui`                                                                     |
| iOS background replies | Local Expo module `modules/nylo-background-response`                                                      |
| Tests                  | Node test runner + `tsx` (unit), Maestro flows in `e2e/` (native UI)                                      |

## Getting started

### Prerequisites

- **Node.js 22.13+.** The pinned version is in `.nvmrc` (`22.22.2`).
- For native builds: **Android Studio** (Android SDK, JDK 17) and/or **Xcode** on macOS.
- A real AI provider API key, if you want replies.

### Install

```sh
nvm use          # optional, uses .nvmrc
npm install      # or `npm ci` once package-lock.json is in sync
```

### Run

```sh
npm start              # Metro dev server
npm run android        # build and run the native Android app (expo run:android)
npm run ios            # build and run the native iOS app (expo run:ios, macOS only)
npm run web            # browser preview of the UI
```

Use a **development build** (`npm run android` / `npm run ios`) rather than Expo Go. Nylo includes a custom native module (iOS background replies) plus native config for the icon, splash and system UI, and Expo Go cannot load those.

You need a fresh native build after changing any of these:

- `app.json`, including the icon, splash, adaptive icon or plugins
- native dependencies in `package.json`
- anything in `android/`, `modules/` or `plugins/`

Changes to JavaScript or TypeScript under `app/` and `src/` reload instantly.

The browser preview is a UI preview only. API keys are held in memory and lost on reload, and provider CORS rules may block requests.

## Connect an AI provider

Open **Settings → Connect your AI** and pick a protocol:

| Protocol | API                                            | Default base URL                                 |
| -------- | ---------------------------------------------- | ------------------------------------------------ |
| OpenAI   | Responses API                                  | `https://api.openai.com/v1`                      |
| Claude   | Anthropic Messages API                         | `https://api.anthropic.com/v1`                   |
| Custom   | OpenAI-compatible Chat Completions (streaming) | your HTTPS base URL, including `/v1` if required |

Enter an exact model ID, or load your provider's model list and choose from it. Then paste your API key. Saving is local: it does not validate the key or spend credits. Sending a message contacts the provider, and its normal charges apply.

Changing a connection's endpoint or protocol requires entering the key again, so a saved key is never reused for a different destination.

PDFs need the OpenAI Responses or Claude Messages protocol, and the model itself must support PDF input.

## Project structure

```
app/                    Screens (Expo Router)
  _layout.tsx             Root providers, fonts, loading screen, stack
  (tabs)/                 Chats, Agents, Settings + tab bar
  chat/[id].tsx           Conversation screen, composer, model picker, attachments
  agent/[id].tsx          Agent workspace and memory
  agent/edit.tsx          Create / edit agent
  connection.tsx          Provider connections and model library
  device-check.tsx        Live device check
  report.tsx              Report a response
src/
  ui.tsx                  Shared components (Page, Button, cards, rows, …) and re-exports
  theme.tsx               Light / dark palettes, ThemeProvider, useTheme
  brand.tsx               Logo mark, wordmark, brand gradient ribbon
  organic.tsx             Aura, thinking orb, gradients, generative avatars
  motion.tsx              Tappable, FadeIn, PopIn, TypingDots, Burst, Reduce Motion
  haptics.ts, sounds.ts   Tactile feels and matching UI sounds
  store.tsx               App state, sending, streaming, persistence
  providers.ts, sse.ts    Provider protocols and streaming parser
  domain.ts, types.ts     Data model, parsing, validation
  storage*.ts             SQLite + SecureStore (native), localStorage (web)
  attachment-*.ts         Attachment picking, validation and storage
assets/
  brand/                  Logo source, in-app mark, wordmark
  figma/                  Original Figma SVG icons (hash-verified)
  fonts/                  Inter, Plus Jakarta Sans, Nimbus Sans, Liberation Mono
  sounds/                 Generated UI sounds
android/                  Committed native Android project
modules/                  Local Expo native module(s)
plugins/                  Expo config plugins
e2e/                      Maestro UI flows (iOS / Android)
tests/                    Unit tests
scripts/                  Asset generators, audits, simulator helpers
docs/                     Design, release, testing and review records
site/                     Support and privacy website (GitHub Pages)
fastlane/                 iOS signing and TestFlight lanes
```

## Design system

**Tokens.** All colour comes from `theme.<token>` in `src/theme.tsx`, for example `bg`, `card`, `surface`, `ink`, `primary`, `accent2`, `line` and `error`. Light and dark use the same token names, so screens never hard-code a palette. Components call `useTheme()` so they re-render when the scheme changes.

**Brand.** Defined in `src/brand.tsx`:

- `BrandMark`: the transparent logo mark. Pass `float` for a gentle bob.
- `BrandWordmark`: "Nylo" in the logo's lettering, tinted to `theme.ink`.
- `BrandLine`: a thin ribbon of the logo gradient.
- `brandStops` / `brandGradient()`: `#34D8C5 → #4C7CF3 → #8B5CF6 → #E25BC8`.

Use the brand pieces as accents, not as fills for whole screens. They currently appear in the tab bar edge, the Chats greeting, the new-chat empty state, the Settings footer and the loading screen. See `docs/design/brand-logo.md`.

**Typography.** Inter for body text and Plus Jakarta Sans for headings, loaded as static weights so iOS and Android match. Use the `Text` / `TextInput` exports from `src/typography.tsx`.

**Icons.** The Figma SVG exports live in `assets/figma/` and are rendered through `DesignIcon`, which tints them per theme. `scripts/check-design-assets.py` verifies their hashes, so don't edit these files.

**Motion.** Use React Native `Animated` with `useNativeDriver: true`, and animate only transform and opacity. Always check `useReducedMotion()`.

## Regenerating assets

```sh
python3 scripts/generate-icon.py        # app icon, adaptive icon, splash, favicon,
                                        # Android mipmaps/splash, in-app mark + wordmark
python3 scripts/generate-ui-sounds.py   # assets/sounds/*.wav
```

Both scripts need Pillow and numpy (`pip install pillow numpy`). The icon script reads `assets/brand/logo-source.png`. To change the logo, replace that file and run the script again. If the mark's position in the new artwork differs, update the crop constants at the top of the script.

## Scripts

| Command                           | What it does                             |
| --------------------------------- | ---------------------------------------- |
| `npm start`                       | Start Metro                              |
| `npm run android` / `npm run ios` | Build and run a native development build |
| `npm run web`                     | Browser preview                          |
| `npm run typecheck`               | `tsc --noEmit`                           |
| `npm test`                        | Unit tests (`tests/*.test.ts`)           |
| `npm run check`                   | Typecheck + tests                        |
| `npm run format` / `format:check` | Prettier write / check                   |
| `npm run export`                  | Static export for all platforms          |
| `npx expo-doctor`                 | Expo project health check                |

## Testing

```sh
npm run check            # typecheck + unit tests
npm run format:check
node scripts/security-check.mjs
python3 scripts/check-design-fonts.py
python3 scripts/check-design-assets.py
```

Unit tests use synthetic streams and fake keys and never contact a provider. They cover all three streaming protocols, fragmented Unicode/SSE, tool round trips, attachments, cancellation, persistence and backups, credential redaction and the state machines in `docs/STATE_MACHINES.md`.

Native UI flows live in `e2e/` (smoke, gallery, attachments, PDF, background and store screenshots). They run on simulators and emulators in CI.

## CI and releases

| Workflow         | Trigger                      | Purpose                                                                    |
| ---------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `checks.yml`     | push to `main`, PRs          | Install, security/font/asset audits, format, typecheck, tests, expo-doctor |
| `android.yml`    | manual                       | Signed APK + AAB                                                           |
| `android-ui.yml` | after Android build / manual | Emulator UI validation                                                     |
| `ios.yml`        | manual                       | Simulator build + screenshots                                              |
| `ios-ui.yml`     | manual                       | Simulator UI flows                                                         |
| `ios-beta.yml`   | manual                       | Signed build and TestFlight upload via fastlane                            |
| `pages.yml`      | push / manual                | Publish `site/` (support and privacy pages)                                |

Signing uses repository secrets only and never commits them:

- Android: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
- iOS: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64`, `APPLE_TEAM_ID`, `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_BASE64`, `CI_KEYCHAIN_PASSWORD`

Heavy native compilation runs in CI rather than on the development machine. Release history and the current store state are in `docs/RELEASE.md` and `docs/STATUS.md`.

## Privacy and data

- **On device:** app state and attachments are stored in SQLite. API keys are stored in the iOS Keychain or Android secure storage, never in SQLite, logs or backups.
- **Sent to your provider:** the conversation context you send, plus the agent's instructions and approved memories for agent chats. Attachments are sent only after you confirm. OpenAI requests use `store: false`, which does not by itself mean zero retention. The provider's own policies apply.
- **No Nylo servers:** there is no account, analytics, tracking or automatic sync.
- **Backups** are readable JSON containing your private conversations. They exclude API keys. Restoring replaces local data and removes saved keys.
- **Appearance, haptics and sound preferences** stay on the device and are not included in backups.
- Full inventory: `docs/PRIVACY_INVENTORY.md`. Public policy: `site/privacy.html`.

## Known limitations

- Only one response runs at a time. A retry is a new request, not a resumption of the old one.
- **iOS** can finish a reply in the background during the limited time the system grants. Long replies, force-quitting or pending memory approvals can still interrupt it. **Android** stops replies in the background.
- The full conversation is sent on each turn. There is no automatic summarisation yet.
- No voice, interactive browsing, code execution or scheduled tasks. Image generation/editing and web search require a supporting connection and enabled capability settings; listing a model does not establish account access.
- The feature candidate uses AI SDK Core on the device, with the saved provider URL/key. Generated images and PDF/TXT documents are kept locally and can be saved/shared. Ask for a PDF or text file to create an attachment directly in chat. Generated file bytes are not automatically sent back as model input; edits require explicit image-send approval. Per-response text/PDF export remains available.
- Whether a provider and model support PDFs, images or tools depends on that provider and model. Nylo doesn't infer it from model names.

## Documentation index

| Document                               | Topic                                                    |
| -------------------------------------- | -------------------------------------------------------- |
| `docs/STATUS.md`                       | Current verified status and open items                   |
| `docs/DELIVERY_PLAN.md`                | Delivery plan                                            |
| `docs/PRODUCT_DESIGN.md`               | Product design direction                                 |
| `docs/design/fresh-theme-extension.md` | Palette, dark mode, motion, organic layer, haptics       |
| `docs/design/brand-logo.md`            | Logo assets and brand gradient usage                     |
| `docs/EXPANDED_BETA.md`                | Agent continuity, model library, attachments             |
| `docs/STATE_MACHINES.md`               | State-machine inventory and contracts                    |
| `docs/QUALITY.md`                      | Quality rubric and reviews                               |
| `docs/RELEASE.md`                      | iOS release and TestFlight history                       |
| `docs/PRIVACY_INVENTORY.md`            | Data inventory                                           |
| `docs/app-store-readiness.md`          | App Store requirements                                   |
| `docs/testing/`                        | Test evidence (builds, PDF, background, device check, …) |
| `AGENTS.md`                            | Rules for working with supplied Figma designs            |

## Support and license

Support: **admin@colorforfun.app** · Privacy policy: https://nihalka.github.io/nylo/privacy.html

Released under the MIT License. See [`LICENSE`](LICENSE). Bundled fonts carry their own open licenses in `assets/fonts/`, and they are also listed in the app under Settings → Font licenses.

Testing updates
