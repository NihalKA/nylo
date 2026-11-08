# Nylo — device edition

A small iOS and Android chat app built with React Native, Expo, and TypeScript. No backend, account, subscription, analytics, or automatic cloud sync.

## Run locally

Requires Node.js 22.13 or newer. If you use nvm:

```sh
cd /Users/nihal/Documents/ChatGPT/nylohq/nylo-mobile
nvm use
npm ci
npm start
```

Open the project in **Expo Go** on an iPhone or Android phone on the same Wi-Fi network. From the Expo terminal, press `i` for an installed iOS simulator or `a` for an installed Android emulator. A development computer is needed to serve the project through Expo Go; installed standalone builds do not need that computer.

On this Mac, you can also double-click **Start Nylo Mobile.command** to start Expo on the local Wi-Fi network. If macOS blocks the simulator auto-launch helper, keep Metro running and open the recently used Nylo project manually inside Expo Go.

```sh
npm run ios       # Expo Go in the iOS simulator; requires Xcode
npm run android   # Android emulator; requires Android Studio/SDK
npm run web       # Browser preview
```

For standalone device builds, generate the native projects with `npx expo prebuild`, then use Xcode/Android Studio or `npx expo run:ios` / `npx expo run:android`. Physical iOS builds require the appropriate Apple signing setup. Store publication is not configured or performed by this project.

## Connect your model

Open **Settings → Add connection**. Pick:

- **OpenAI:** Responses API. Default base URL `https://api.openai.com/v1`.
- **Claude:** Anthropic Messages API. Default base URL `https://api.anthropic.com/v1`.
- **Custom API:** OpenAI-compatible streaming Chat Completions API. Enter the provider's HTTPS base URL, including `/v1` when required.

Enter the exact model ID available to your account and paste your own API key into the app. Saving is local and does not validate the key or spend API credits. Sending a message contacts the selected provider and incurs its normal charges. Native apps can connect directly; browser preview also depends on the provider's CORS policy.

Keys are never imported from the existing desktop client or from this computer's Codex configuration.

## Chats and agents

- **Chats** are independent conversations with saved history. Copy answers, rename or delete conversations, change the model connection, and retry an interrupted response.
- **Agents** have a name, purpose, instructions, default connection, and separate persistent memory. They can have multiple conversations. New conversations receive the agent's current instructions and memories.
- Agents have exactly two local tools: `remember_fact` and `forget_fact`. Ask “remember that I prefer concise answers,” or add, edit, and delete facts in the Memory screen. Tools require a model/provider that supports function calling.
- **Create agent from chat** preserves the conversation and lets you review up to 1,000 characters of starting context before saving it as a memory.

This is a local conversational agent foundation, not full Grok Bot parity. It does not have browser automation, external integrations, file attachments, voice, code execution, task scheduling, or unattended background jobs.

## Persistence and privacy

- Native builds persist application state atomically in a local SQLite database. API keys are separate, in Expo SecureStore (iOS Keychain / Android secure storage). No keys are placed in SQLite, application logs, or backups.
- Changing a provider/endpoint requires entering the key again, so an existing credential is not silently reused for a different destination.
- The browser preview stores history in browser local storage. Its API keys exist only in memory and must be entered again after reloading. It is a preview of the mobile UI, not a secure persistent browser key vault.
- Sending a message sends the retained conversation context to the selected provider. Agent requests also include their instructions and saved memories. Provider processing/retention policies still apply. OpenAI requests explicitly use `store: false`; this does not imply zero retention by the provider.
- Data survives normal app restarts, but not necessarily uninstalling the app, resetting the phone, or clearing app/browser data. Export a backup first.
- JSON backup/restore transfers chats, agents, memory, and connection metadata. Backups contain private conversation data but **exclude API keys**. Restore replaces app data and removes current saved keys. Re-enter keys afterward.

## Interruptions

Only one response runs at a time. Foreground execution is intentional in this first version: leaving the app aborts the active request. A three-minute request limit prevents an indefinitely stalled call. Partial text is saved periodically, and runs left streaming by a crash/restart are marked interrupted.

**Retry makes a new provider request**; it is not token-level resumption of the old request. Prior partial output is excluded from model context. Completed memory changes persist; saving the same fact twice is deduplicated. Provider work may still consume tokens after the client disconnects.

The full conversation is sent on each turn. There is no automatic summarization/context compaction yet. Start a new agent conversation to reuse memory without resending an indefinitely long transcript.

## Checks

```sh
npm run check
npx expo-doctor
npm run export
```

Tests use synthetic streams and fake keys; they do not contact AI providers. They cover all three streaming protocols, fragmented Unicode/SSE, tool round trips, incomplete responses, provider errors, cancellation, chat promotion, memory isolation, backup validation, and credential redaction.

Official references: [Expo](https://docs.expo.dev/), [OpenAI streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [Anthropic streaming](https://platform.claude.com/docs/en/build-with-claude/streaming).
