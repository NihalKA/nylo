<p align="center">
  <img src="assets/brand/mark.png" alt="Nylo logo" width="140" />
</p>

<h1 align="center">Nylo</h1>

<p align="center">
  A calm, private chat app for <strong>your own</strong> AI providers.<br />
  Chat when you need an answer. Switch to an agent when you want a teammate with its own instructions and memory.
</p>

<p align="center">
  iOS · Android · React Native + Expo · TypeScript · No backend, no account, no tracking
</p>

---

## Contents

- [What Nylo is](#what-nylo-is)
- [A tour of the app](#a-tour-of-the-app)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Run on your phone](#run-on-your-phone)
- [Troubleshooting](#troubleshooting)
- [Connect an AI provider](#connect-an-ai-provider)
- [Project structure](#project-structure)
- [How the home screen works](#how-the-home-screen-works)
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

## A tour of the app

Nylo opens straight into a **new chat**. There is no tab bar and no list to get past first.

```
┌───────────────────────────────────────┐
│ 🕘   ◎ Let’s begin            ✎   ⚙   │  history · title · new · settings
│ ┌─────────────────┬─────────────────┐ │
│ │     💬 Chat     │    ✨ Agent     │ │  mode toggle
│ └─────────────────┴─────────────────┘ │
│  ╭────────────────────────────╮ ╭──   │  agent strip (Agent mode only):
│  │ (•‿•) Writing partner   ›  │ │(•   │  swipe to switch agents
│  │ ● Online · Drafts that…    │ │     │
│  ╰────────────────────────────╯ ╰──   │
│                 ● ○ ○                 │
│                                       │
│        messages, or a welcome         │
│                                       │
│ ╭───────────────────────────────────╮ │
│ │ +   Message Nylo…               ↑ │ │  composer, rises with the keyboard
│ ╰───────────────────────────────────╯ │
└───────────────────────────────────────┘
```

| Where                   | What you do there                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home, Chat mode**     | Ask anything. An empty chat shows the logo, "How can I help?" and starters (_Help me write_, _Think it through_, _Summarize_, _Plan my day_). Messages stay on this screen as you talk.                                                                      |
| **Home, Agent mode**    | Talk to one of your agents. A compact strip shows the agent as a small animated character; swipe it to switch agents. Each agent reopens its latest session, so you pick up where you left off. The last card in the strip has **New agent** and **Manage**. |
| **History** (🕘, left)  | A side menu with **New chat**, search, an _All / Chats / Agents_ filter, history grouped by Today / Yesterday / Previous 7 days / Earlier, an **Archived** section and your profile row. Tap ⋯ or long-press a chat to archive, restore or delete it.        |
| **Settings** (⚙, right) | Providers, appearance, sound and touch, backups, advanced tools and licences.                                                                                                                                                                                |
| **New** (✎)             | Appears once the current conversation has messages. Starts a fresh chat, or a fresh session with the current agent.                                                                                                                                          |

If no provider is connected yet, the welcome area shows a single **Connect API key** card.

## Features

### Chats

- Independent conversations with saved history, drafts and attachments.
- Search across titles, drafts, agent names and message text from the History menu.
- Archive and restore, or delete with confirmation. Deleting a chat keeps any agent memories it produced.
- Copy, report, retry and rename. Each conversation can use a different model.
- A searchable model picker, grouped by saved connection.

### Agents

- Each agent has its own name, purpose, instructions, **personality** (_Doer_: gets straight to the work, _Planner_: lays out the steps then delivers, _Coach_: asks questions and guides you), default connection and **separate persistent memory**.
- **Agents as characters.** Every agent is drawn as a small face in its own colour. Its look (eyes and mouth) is derived from its name, so it stays the same everywhere. It reacts to the conversation:

  | Mood      | When                       | What it does                                       |
  | --------- | -------------------------- | -------------------------------------------------- |
  | Idle      | Nothing happening          | Blinks now and then                                |
  | Listening | You are typing             | Leans in, tilts its head, eyes widen               |
  | Thinking  | Waiting for the first word | Eyes wander as if reading; a thought bubble pulses |
  | Speaking  | The reply is streaming     | Mouth talks, gentle bob                            |

  The status under its name follows along: _Listening…_, _Reading and thinking…_, _Replying…_, _Online_.

- **Creating an agent** starts from a live preview of the character. Pick a starter character (_Writing partner_, _Thinking partner_, _Project guide_) to fill in the name, purpose, instructions, colour and personality, or build your own. Inputs glow in the agent's colour while you type.
- Memory is something you can see and edit. Facts the model proposes need your approval before they are saved. You can add, edit and delete facts in the Memory screen.
- Optional **recent-chat context**: bounded text from up to 8 earlier conversations with the same agent. It is off unless you turn it on, and it never includes personal chats or chats with other agents.
- Start an agent from an existing chat, or from a starter role.

### Interactive replies

Replies are Markdown, rendered as native components in the app's own colours:

- **Tables** become a card with a tinted header. Tap a column to sort it (ascending, descending, off); numbers sort as numbers (`$1.2k`, `45%`, `1,234`) and are right-aligned with even-width digits. Tap a row to highlight it. Switch between **table** and **card** view (wide tables open as cards on narrow phones). Long tables show 6 rows with **Show all**. **Copy** puts the table on the clipboard as Markdown.
- **Code blocks** show their language and have a **Copy** button.
- **Quotes** become soft callouts. Starting with _Tip_, _Note_ or _Warning_ picks a tone and icon.
- **Lists** get accent bullets and numbers; task lists (`- [x]`) get check icons. Headings are weighted and dividers are a faded gradient line.
- While a reply streams, each new block (and each new table row) glides in. Opening an older chat does not re-animate it.
- Links open only for `http(s)` URLs. Model HTML is shown as text and is never executed; remote images are never loaded.

### Providers and models

- **OpenAI** (Responses API), **Claude** (Anthropic Messages API) and **any OpenAI-compatible** endpoint (Chat Completions).
- Save a model library per connection (up to 500 model IDs, with "select all"), set a default, and switch models per chat.
- Streaming replies, cancellation, and retry (a retry is a new request).

### Attachments

- Up to **4 files** per message: 2 MB each, 4 MB in total.
- Photos (re-encoded to JPEG, which removes EXIF data), the camera, PDF, and TXT / Markdown / CSV / JSON.
- Picking a file uploads nothing. Each send that includes attachments asks for permission to share them with the named provider.

### Typing

- The composer sits **just above the keyboard** on iPhone and Android, with a small gap, and the message list shrinks so the latest messages stay visible.
- The text box grows line by line up to about 40% of the screen, then scrolls inside. The font size never changes.
- Text and placeholder are vertically centred in the box.
- While you type, the composer glows: the brand gradient in a chat, the agent's own colour in an agent session.

### Look and feel

- **Light, Dark and System** appearance (Settings → Appearance).
- A "Fresh" palette with a brighter blue accent, raised cards and a soft time-of-day aura behind the top of the screen.
- **Motion** uses one shared ease-in, ease-out curve. Switching Chat ↔ Agent crossfades and slides the two screens in one movement; the agent strip grows in at the same pace; swapping agents fades the old session out before the new one fades in. Controls glide and settle without bouncing. Every animation respects **Reduce Motion**.
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
| AI                     | AI SDK Core (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/openai-compatible`), running on device |
| Markdown               | `marked` (lexer only) rendered to native components                                                       |
| Storage                | `expo-sqlite` (app state and attachment blobs), `expo-secure-store` (API keys)                            |
| Media                  | `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `expo-document-picker`                       |
| Feel                   | `expo-haptics`, `expo-audio`, React Native `Animated` (native driver), native `backgroundImage` gradients |
| Theming                | `src/theme.tsx` plus `expo-system-ui`                                                                     |
| iOS background replies | Local Expo module `modules/nylo-background-response`                                                      |
| Tests                  | Node test runner + `tsx` (unit), Maestro flows in `e2e/` (native UI)                                      |

## Getting started

### Prerequisites

- **Node.js 22.13+.** The pinned version is in `.nvmrc` (`22.22.2`). Older 22.x releases print `EBADENGINE` warnings.
- For native builds: **Android Studio** (Android SDK, JDK 17) and/or **Xcode** on macOS.
- A real AI provider API key, if you want replies.

### Install

```sh
nvm use          # optional, uses .nvmrc
npm ci           # installs exactly what package-lock.json lists
```

Use **`npm ci`**, not `npm install`. Some npm versions (seen with npm 11.0.0 on Windows) rewrite `package-lock.json` during `npm install` and drop the `zod` peer dependency that the AI SDK needs, which breaks the bundle. See [Troubleshooting](#troubleshooting).

### Run

```sh
npm start              # Metro dev server
npm run android        # build and run the native Android app (expo run:android)
npm run ios            # build and run the native iOS app (expo run:ios, macOS only)
npm run web            # browser preview of the UI
```

Use a **development build** (`npm run android` / `npm run ios`) rather than Expo Go. Nylo includes custom native modules (iOS background replies, document preview) plus native config for the icon, splash and system UI, and Expo Go cannot load those.

You need a fresh native build after changing any of these:

- `app.json`, including the icon, splash, adaptive icon or plugins
- native dependencies in `package.json`
- anything in `android/`, `modules/` or `plugins/`

Changes to JavaScript or TypeScript under `app/` and `src/` reload instantly.

The browser preview is a UI preview only. API keys are held in memory and lost on reload, provider CORS rules may block requests, and the native keyboard, haptics and some animations behave differently.

## Run on your phone

### Android over USB (Windows, macOS or Linux)

1. Install **Android Studio** (it brings the Android SDK) and **JDK 17**. Set `ANDROID_HOME` to the SDK folder and add its `platform-tools` to your `PATH`.
2. On the phone: **Settings → About phone → tap Build number 7 times**, then turn on **Developer options → USB debugging**.
3. Plug the phone in and accept the "Allow USB debugging" prompt. Check it is listed:

   ```sh
   adb devices
   ```

4. First time, build and install the development app:

   ```sh
   npm ci
   npm run android
   ```

5. Afterwards, for JavaScript/TypeScript changes only, start Metro and open Nylo on the phone:

   ```sh
   npx expo start --dev-client --clear
   ```

   Keep the phone on USB, or on the same Wi-Fi as your computer. Press `a` in the Metro terminal to open the app on the connected device.

### Without Android Studio

Trigger the **`android.yml`** workflow in GitHub Actions to build a signed APK, download it from the run, and install it on the phone. The APK contains whatever was committed and pushed on the branch the workflow built.

### iPhone

Run `npm run ios` on a Mac with Xcode, or use the **`ios-beta.yml`** workflow to upload a build to TestFlight.

## Troubleshooting

| Symptom                                                                                       | Cause                                                                                                     | Fix                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Unable to resolve "zod/v4" from "node_modules\@ai-sdk\openai-compatible\..."`                | `node_modules` is incomplete, usually after `npm install` rewrote `package-lock.json` and left `zod` out. | `git checkout -- package-lock.json`, then `npm ci`, then restart Metro with `npx expo start --dev-client --clear`.                   |
| `npm ci` fails with `EBUSY: resource busy or locked ... ReactAndroid\gradle.properties`       | The Gradle daemon from an Android build is holding files in `node_modules` (Windows).                     | Run `android\gradlew.bat --stop` (or `./gradlew --stop` in `android/`), then `npm ci` again. Stop Metro first if the error persists. |
| Missing `ai`, `marked` or other packages, or many type errors in files you didn't touch       | A partial install.                                                                                        | `npm ci`.                                                                                                                            |
| `useNativeDriver is not supported because the native animated module is missing` (web)        | Normal in the browser preview; animations fall back to JavaScript.                                        | Nothing to do. It does not appear in the native app.                                                                                 |
| Bundling works but the app still shows an old error                                           | Metro cached the failed bundle.                                                                           | Stop Metro (Ctrl+C) and start it again with `--clear`.                                                                               |
| Keyboard covers the composer, or there is a large gap above the keyboard on one Android phone | The keyboard height reported by that device differs from what `src/keyboard-math.ts` expects.             | Check `keyboardLiftFor` in `src/keyboard-math.ts` and its tests in `tests/keyboard-lift.test.ts`; report the device and screenshot.  |

## Connect an AI provider

Open **Settings → Connect your AI** (or tap **Connect API key** on the home screen) and pick a protocol:

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
app/                      Screens (Expo Router)
  _layout.tsx               Root providers, fonts, loading screen, stack
  index.tsx                 Home: top bar, Chat/Agent toggle, agent strip,
                            both conversations kept mounted and crossfaded
  chat/[id].tsx             Conversation screen, composer, model picker,
                            attachments; also embeddable on the home screen
  settings.tsx              Settings
  agents.tsx                Manage agents (list)
  agent/[id].tsx            Agent workspace and memory
  agent/edit.tsx            Create / edit agent (live character preview)
  connection.tsx            Provider connections and model library
  device-check.tsx          Live device check
  report.tsx                Report a response
  licenses.tsx              Font licences
src/
  ui.tsx                    Shared components (Page, Header, Button, Field,
                            Segmented, cards, rows, …) and re-exports
  side-nav.tsx              History side menu: search, filters, groups,
                            archive / restore / delete, settings row
  agent-character.tsx       Animated agent faces and moods
  rich-blocks.tsx           Interactive table, code block, callout
  message-content.tsx       Markdown → native blocks
  keyboard-lift.ts          Keeps the composer above the keyboard
  keyboard-math.ts          The lift calculation (unit tested)
  theme.tsx                 Light / dark palettes, ThemeProvider, useTheme
  brand.tsx                 Logo mark, wordmark, brand gradient ribbon
  organic.tsx               Aura, thinking orb, gradients, generative avatars
  motion.tsx                Shared curve (smooth/glide), Tappable, FadeIn,
                            PopIn, TypingDots, Burst, Reduce Motion
  haptics.ts, sounds.ts     Tactile feels and matching UI sounds
  store.tsx                 App state, sending, streaming, persistence
  providers.ts, sse.ts      Provider protocols and streaming parser
  sdk-*.ts                  On-device AI SDK engine, tools and errors
  domain.ts, types.ts       Data model, parsing, validation
  storage*.ts               SQLite + SecureStore (native), localStorage (web)
  attachment-*.ts           Attachment picking, validation and storage
assets/
  brand/                    Logo source, in-app mark, wordmark
  figma/                    Original Figma SVG icons (hash-verified)
  fonts/                    Inter, Plus Jakarta Sans, Nimbus Sans, Liberation Mono
  sounds/                   Generated UI sounds
android/                    Committed native Android project
modules/                    Local Expo native modules
plugins/                    Expo config plugins
e2e/                        Maestro UI flows (iOS / Android)
tests/                      Unit tests
scripts/                    Asset generators, audits, simulator helpers
docs/                       Design, release, testing and review records
site/                       Support and privacy website (GitHub Pages)
fastlane/                   iOS signing and TestFlight lanes
```

## How the home screen works

`app/index.tsx` keeps **one open conversation per place**: one for Chat, and one per agent.

- **On launch** Chat resumes an unsent draft if there is one, otherwise starts a blank chat. The current agent's session is prepared at the same time, so the first switch to Agent never waits.
- **Agent sessions** reopen the agent's most recent non-archived conversation, or start one if it has none.
- **Both screens stay mounted.** The Chat and Agent conversations are rendered in two stacked layers; one animated value crossfades and slides between them. Nothing is rebuilt when you switch, so nothing flickers.
- **Swapping inside a layer** (another agent, a new session, opening history) fades the old conversation out first and fades the new one in once it is ready, so nothing is ever painted at full strength before it animates.
- **History opens in place.** Picking a chat in the side menu switches to the right mode and agent. Archived chats open on their own screen (`/chat/[id]`).
- **Embedded chats.** `Chat` in `app/chat/[id].tsx` accepts `chatId` and `home` slots (`renderIntro`, `onActivity`). On the home screen it renders without its own page or back button, and reports what it is doing (`idle`, `listening`, `thinking`, `speaking`) so the agent character can react.

## Design system

**Tokens.** All colour comes from `theme.<token>` in `src/theme.tsx`, for example `bg`, `card`, `surface`, `ink`, `primary`, `accent2`, `line` and `error`. Light and dark use the same token names, so screens never hard-code a palette. Components call `useTheme()` so they re-render when the scheme changes. Agent screens tint with the agent's own colour through `rgba(agent.color, …)`.

**Brand.** Defined in `src/brand.tsx`:

- `BrandMark`: the transparent logo mark. Pass `float` for a gentle bob.
- `BrandWordmark`: "Nylo" in the logo's lettering, tinted to `theme.ink`.
- `BrandLine`: a thin ribbon of the logo gradient.
- `brandStops` / `brandGradient()`: `#34D8C5 → #4C7CF3 → #8B5CF6 → #E25BC8`.

Use the brand pieces as accents, not as fills for whole screens. They currently appear in the home top bar, the empty-chat welcome, the History menu, the Settings footer and the loading screen. See `docs/design/brand-logo.md`.

**Typography.** Inter for body text and Plus Jakarta Sans for headings, loaded as static weights so iOS and Android match. Use the `Text` / `TextInput` exports from `src/typography.tsx`.

**Icons.** The Figma SVG exports live in `assets/figma/` and are rendered through `DesignIcon`, which tints them per theme. `scripts/check-design-assets.py` verifies their hashes, so don't edit these files. Other icons use Ionicons through `Icon`.

**Motion.** Use React Native `Animated`, animate transform and opacity with `useNativeDriver: true` where possible, and always check `useReducedMotion()`. For transitions use the shared curve and durations from `src/motion.tsx`:

```ts
import { smooth, glide } from "../src/motion";

Animated.timing(value, {
  toValue: 1,
  duration: glide.base, // quick 180 · base 280 · slow 420
  easing: smooth, // ease-in, ease-out, settles gently
  useNativeDriver: true,
}).start();
```

Avoid bouncy springs for UI state changes; a spring with `bounciness: 0` is fine for drag follow-through. Small looping effects (typing dots, breathing glows) keep their own sine curves.

## Regenerating assets

```sh
python3 scripts/generate-icon.py        # app icon, adaptive icon, splash, favicon,
                                        # Android mipmaps/splash, in-app mark + wordmark
python3 scripts/generate-ui-sounds.py   # assets/sounds/*.wav
```

Both scripts need Pillow and numpy (`pip install pillow numpy`). The icon script reads `assets/brand/logo-source.png`. To change the logo, replace that file and run the script again. If the mark's position in the new artwork differs, update the crop constants at the top of the script.

## Scripts

| Command                               | What it does                             |
| ------------------------------------- | ---------------------------------------- |
| `npm ci`                              | Install dependencies from the lockfile   |
| `npm start`                           | Start Metro                              |
| `npx expo start --dev-client --clear` | Start Metro with a clean cache           |
| `npm run android` / `npm run ios`     | Build and run a native development build |
| `npm run web`                         | Browser preview                          |
| `npm run typecheck`                   | `tsc --noEmit`                           |
| `npm test`                            | Unit tests (`tests/*.test.ts`)           |
| `npm run check`                       | Typecheck + tests                        |
| `npm run format` / `format:check`     | Prettier write / check                   |
| `npm run export`                      | Static export for all platforms          |
| `npx expo-doctor`                     | Expo project health check                |

## Testing

```sh
npm run check            # typecheck + unit tests
npm run format:check
node scripts/security-check.mjs
python3 scripts/check-design-fonts.py
python3 scripts/check-design-assets.py
```

Unit tests use synthetic streams and fake keys and never contact a provider. They cover all three streaming protocols, fragmented Unicode/SSE, tool round trips, attachments, cancellation, persistence and backups, credential redaction, the keyboard lift calculation and the state machines in `docs/STATE_MACHINES.md`.

Native UI flows live in `e2e/` (smoke, gallery, attachments, PDF, background and store screenshots). They run on simulators and emulators in CI.

> **Note:** several `e2e/` flows still target the previous layout (a bottom tab bar with _Chats_, _Agents_ and _Settings_, and a _New chat_ button on a chat list). They need updating for the home screen, the History menu and the Settings button before they will pass.

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
- **Agent characters** are drawn on the device from the agent's name and colour. No images are generated or downloaded.
- **Backups** are readable JSON containing your private conversations. They exclude API keys. Restoring replaces local data and removes saved keys.
- **Appearance, haptics and sound preferences** stay on the device and are not included in backups.
- Full inventory: `docs/PRIVACY_INVENTORY.md`. Public policy: `site/privacy.html`.

## Known limitations

- Only one response runs at a time. A retry is a new request, not a resumption of the old one.
- **iOS** can finish a reply in the background during the limited time the system grants. Long replies, force-quitting or pending memory approvals can still interrupt it. **Android** stops replies in the background.
- The full conversation is sent on each turn. There is no automatic summarisation yet.
- On **Android**, the system reports the keyboard only after it has finished opening, so the composer rises a moment (about 0.2 s) after the keyboard. Removing that lag needs a native keyboard library and a new build.
- The home screen's conversation menu (rename, export) is available when a chat is opened on its own screen; on the home screen, use History for archive and delete.
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
