# Nylo brand logo

Added 11 November 2026 from the owner's logo artwork (`assets/brand/logo-source.png`).
The brand layer adds accents and leaves the app palette in `src/theme.tsx`, motion,
haptics and sounds as they were.

## Assets (regenerate with `python3 scripts/generate-icon.py`)

- `assets/icon.png`: iOS/Expo app icon, the mark on the logo's dark background `#05081A`.
- `assets/adaptive-icon.png`, `assets/android-icon-foreground.png`: Android adaptive foreground. The mark sits inside the 66% safe zone. Background colour `#05081A`.
- `android/app/src/main/res/mipmap-*`, `drawable-*/splashscreen_logo.png`: the committed native Android icons and splash.
- `assets/splash-icon.png`, `assets/favicon.png`.
- `assets/brand/mark.png`: transparent mark for in-app use.
- `assets/brand/wordmark.png`: "Nylo" in the logo's lettering, white on alpha, tinted to `theme.ink` at runtime.

## Logo gradient

`brandStops` in `src/brand.tsx`: teal `#34D8C5` → blue `#4C7CF3` → violet `#8B5CF6` → pink `#E25BC8`.
It's used sparingly, in both light and dark mode:

| Where | What |
| --- | --- |
| Tab bar, top edge | `BrandLine`, a faint 1.5 px ribbon |
| Chats header | Small `BrandMark` beside the greeting |
| New chat (no agent) | Floating `BrandMark` above "Let's begin" (static under Reduce Motion) |
| Settings footer | `BrandLine`, `BrandMark` and `BrandWordmark` above the version |
| Launch loading screen | `BrandMark` above the typing dots |

The logo's lettering appears only as the wordmark image. No app text uses it.
