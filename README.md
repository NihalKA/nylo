# Nylo

An iOS-first chat app for your own AI providers. Chats keep conversations together; agents add their own instructions and editable memory. Android shares the codebase; Play Store publication follows the iOS launch.

## Develop

Use the Node version in `.nvmrc`, then `npm ci` and `npm start`. Expo Go is useful for local UI iteration; store releases use standalone native builds.

```sh
npm run check
npm run format:check
npx expo-doctor
```

Native iOS compilation runs on standard GitHub macOS runners to keep heavy work off the development Mac. See [delivery plan](docs/DELIVERY_PLAN.md), [status](docs/STATUS.md), [quality gates](docs/QUALITY.md), and [release setup](docs/RELEASE.md).

## Privacy and limitations

Chats and memory stay on the device until sent to the chosen AI provider or explicitly exported. API keys use native secure storage and are excluded from app exports. User API charges apply. No Nylo account or automatic sync. On iOS, in-progress responses can finish during the limited background time granted by the system. Long responses, force-quitting, or memory approvals can still interrupt them; retry is a new request. Android currently stops responses in the background. Backups contain readable private conversation data.

This is under active development, not a published store release. See STATUS.md for verified evidence and remaining blockers. Support: admin@colorforfun.app.
