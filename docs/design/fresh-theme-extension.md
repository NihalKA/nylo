# "Fresh" theme: owner-requested design-system extension

Requested by the owner on 10 November 2026, after local testing of the Figma
implementation (reference `WNCRguvh0wqYTgBUlbXZ9G`, see `figma-coverage.json`).
The request: a brighter (less "blackish") blue, light and dark modes, more
intuitive card designs, and press/loading animations that work on both iOS and
Android. The result should feel energetic but minimal and not overwhelming.

**No new Figma link was supplied.** This is a design-system extension. Layout,
spacing, typography and the original SVG artwork from the Figma reference are
kept. Colour, card treatment and motion go beyond that reference. The earlier
Figma coverage records are unchanged and are not superseded by this file.

## What changed

| Requirement                 | Implementation                                                                                                                                                                                                                                                                                                                                     | Verification                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Less blackish accent        | `primary` `#1E2B58` → `#3358E0` (light), `#4466EE` (dark). Text ink lightened from navy `#061542` to slate `#141A2E`.                                                                                                                                                                                                                              | Contrast table below; `npm run typecheck`           |
| Light / dark / system       | `src/theme.tsx`: two palettes with the same token names, a live `theme` object and a `ThemeProvider`. Settings → Appearance segmented control. The choice is stored per device in the SQLite `preferences` table (web: `localStorage`) and is **not** included in backups or "Delete all local data".                                              | Typecheck, unit tests; device check pending (below) |
| Native chrome follows theme | `Appearance.setColorScheme` override for explicit choices (alerts, iOS keyboard), `expo-system-ui` root background, scheme-aware status bar, `app.json` `userInterfaceStyle: "automatic"`                                                                                                                                                          | Requires a new native build (see below)             |
| Figma icons in dark mode    | All 45 SVGs are single-colour. Each is mapped to a palette role (ink / sub / quiet / lineStrong / error / onPrimary) and tinted with `expo-image` `tintColor`. The SVG files are unchanged.                                                                                                                                                        | `check-design-assets.py` hashes unchanged in git    |
| Card designs                | Chats: avatar or icon lead, relative date, agent name in accent, "Draft" chip. Agents: 48 pt avatar and a memory chip. Templates: tinted icon cards. Settings: groups in raised cards. The connect-provider prompt is now a tinted card.                                                                                                           | Visual check pending                                |
| Press feedback              | `Tappable` (spring scale + opacity) on buttons, icon buttons, cards and settings rows                                                                                                                                                                                                                                                              | Visual check pending                                |
| Send / loader animation     | Send button springs in when there is something to send. Waiting for a reply shows a "typing" bubble with bouncing dots and a breathing "Thinking…" label. While streaming, small dots sit next to the agent name. The stop button has a pulsing ring. New messages fade and lift in; history already on screen when a chat opens does not animate. | Visual check pending                                |
| Navigation                  | Tab bar has an accent pill that springs in on the selected tab, and a `shift` transition between tabs                                                                                                                                                                                                                                              | Visual check pending                                |
| Reduce Motion               | Every animation checks `AccessibilityInfo.isReduceMotionEnabled()` and falls back to static states                                                                                                                                                                                                                                                 | Code review                                         |

All motion uses React Native's built-in `Animated` with `useNativeDriver: true`
(transform and opacity only), so no new animation dependency is needed.
`expo-system-ui` is the only new package; it is native and needs a rebuild.

## Organic layer (second pass, same day)

After the first pass, the owner said the app felt "too basic" and asked for it to feel organic and innovative while staying minimal. Added in `src/organic.tsx`, using React Native's native `backgroundImage` gradients (no new dependency, no extra native rebuild):

| Element          | Behaviour                                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Time-of-day aura | Two soft radial colour clouds drift slowly (18 s cycle) behind the header on Chats, Agents, Settings and a new, empty chat. Morning: peach/sky. Afternoon: sky/mint. Evening: violet/rose. Night: indigo/teal. Lower opacity in dark mode. |
| Greeting         | "Good morning / afternoon / evening" or "Still up?" above the Chats title                                                                                                                                                                  |
| Thinking orb     | Replaces the dots in the waiting bubble: a sphere with two lit blobs orbiting inside it and a breathing halo, so its shape gently morphs                                                                                                   |
| Gradient accents | Blue to violet (`primary` to `accent2`) on primary buttons, create buttons, send and stop. Agent avatars get a lit gradient of their own colour.                                                                                           |
| Empty states     | A floating, gently tilting gradient icon (Chats empty, new chat without an agent)                                                                                                                                                          |
| New chat         | Suggestion pills fade in one after another; the composer gets a soft accent glow while focused                                                                                                                                             |

`accent2` is #6A4DF4 (light) / #6E56F0 (dark). White text on it measures 5.28:1 and 4.94:1. Every animation still respects Reduce Motion.

## Interaction and identity pass (third round)

The owner asked for more organic interactions, richer cards, and avatars that feel inventive. Higgsfield (suggested for generated artwork) was not connected to this session. Avatars are generated in code instead, so they adapt to theme and to agents created later.

| Element                  | Behaviour                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generative avatars       | `meshAvatar(color, name)`: the agent's chosen colour plus two companion hues as layered radial gradients. Positions are seeded from the name: stable per agent, distinct between agents, no image assets. |
| Agent identity cards     | A colour wash header in the agent's colour with a violet glint. A 56 pt avatar overlaps the wash. Chips for memories and "Uses recent chats".                                                             |
| Living chat cards        | A faint glow of the agent's colour from the top-left corner. While a chat is replying, its card shows a mini orb with "Replying…" and a soft accent glow.                                                 |
| Touch ripple             | Cards and settings rows bloom with colour from the exact touch point (`Tappable` `ripple`)                                                                                                                |
| Scroll-linked aura       | On Chats, the aura drifts up and fades as content scrolls, and a hairline appears under the header                                                                                                        |
| Send burst               | A violet ring bursts from the send button                                                                                                                                                                 |
| Streaming caret          | A glowing, breathing dot follows a reply while it streams                                                                                                                                                 |
| Copy                     | Icon pops into a green check                                                                                                                                                                              |
| Tabs                     | The selected icon swells briefly as its pill springs in                                                                                                                                                   |
| Haptics (`expo-haptics`) | Selection: tab change, appearance, switches, suggestions. Light: send, create. Medium: stop. Success: copy. Not on every tap.                                                                             |

`expo-haptics` is a new native module and needs a native rebuild. Every animation still respects Reduce Motion.

## Avatars, aura picker, sound and touch (fourth round)

**Aura picker** (agent create/edit): the five flat colour squares are replaced by eight named, vivid "auras" (Ocean, Iris, Orchid, Coral, Amber, Fern, Lagoon, Dusk; `agentColors` in `src/domain.ts`). Each swatch is a live miniature of the mesh avatar it produces for the typed name. The chosen swatch swells inside a gradient ring. Agents saved with earlier colours keep them; they appear as a "Current" swatch. `LivingAvatar` breathes inside a halo of its colour and springs with a burst on colour change. It is used on agent edit, agent detail and new chat.

**One feel = haptic + sound, same rhythm.** `src/haptics.ts` defines each feel once; `play(feel)` starts its haptic and its sound together. Multi-pulse feels use the same millisecond gaps in both.

| Feel                 | Used for                          | iOS haptic                | Android haptic                    | Sound                            |
| -------------------- | --------------------------------- | ------------------------- | --------------------------------- | -------------------------------- |
| tick                 | icon buttons (back, copy, close)  | selection                 | Keyboard_Tap                      | tiny A5 tick                     |
| button               | buttons, settings rows            | light impact              | Virtual_Key                       | short D5 tap                     |
| card                 | opening chat/agent/template cards | soft impact               | Context_Click                     | soft F#5 + A4 dyad               |
| create               | new chat / new agent              | medium impact             | Confirm                           | open fifth D5 + A5               |
| select               | tabs, appearance, suggestions     | selection                 | Segment_Tick                      | airy E6                          |
| aura                 | choosing an agent colour          | rigid, then soft (70 ms)  | Clock_Tick, Segment_Frequent_Tick | B5 click, then E6 bloom          |
| toggleOn / toggleOff | switches                          | medium / light            | Toggle_On / Toggle_Off            | A5 gliding up / F#5 gliding down |
| send                 | sending                           | medium, then soft (90 ms) | Virtual_Key, Gesture_End          | D5, then A5 echo                 |
| stop                 | stopping a reply                  | heavy                     | Long_Press                        | low muted A4                     |
| landed               | reply finished                    | soft, soft (110 ms)       | Gesture_End, Clock_Tick           | F#5 resolving to D5              |
| success              | copied                            | success notification      | Confirm                           | A5, then D6                      |
| warn                 | destructive actions               | warning notification      | Reject                            | two muted B4                     |
| error                | reply failed                      | error notification        | Reject                            | E5, D5, B4 falling               |
| scroll               | moving through Chats/Agents       | selection (throttled)     | Segment_Frequent_Tick             | silent                           |

Sounds are original, synthesized by `scripts/generate-ui-sounds.py`. All notes come from D-major pentatonic, so every pair is consonant. Peaks are about −13 to −16 dBFS, and the 14 WAVs total about 724 KB.

**Settings → Sound & touch** has independent Sounds and Vibration switches, stored per device and not in backups.

**Platform etiquette and permissions**

- iOS: sounds respect the ring/silent switch (`playsInSilentMode: false`) and mix with other audio. No microphone usage string and no background audio mode; this was verified with `expo config --type introspect`.
- Android: haptics use `performHapticFeedback`, which follows the system touch-feedback setting and needs no permission. Release builds strip `VIBRATE` (`manifest-policy.py`) and `audit.py` asserts it is absent. `expo-audio` adds `MODIFY_AUDIO_SETTINGS`, an install-time permission with no user prompt; `RECORD_AUDIO` is disabled in the plugin config. Android has no ring/silent switch equivalent for app sounds, so the in-app switch is the control there.
- `expo-audio` and `expo-haptics` are native modules and need a native rebuild.

## Revision after device testing (11 Nov 2026, Samsung Galaxy S22)

- **Android vibration was not felt.** `performHapticFeedback` constants (Segment_Tick, Clock_Tick, Context_Click, …) are mostly no-ops on Samsung One UI, or are gated by the system touch-interaction setting. Android now plays explicit motor patterns through React Native's `Vibration` API. Each feel differs in pulse length (10–48 ms) and rhythm, with gaps identical to its sound. The Android haptic column in the table above is superseded by `src/haptics.ts`. This needs the `VIBRATE` install-time permission declared by `expo-haptics`, so the release policy no longer strips it.
- **Sounds softened.** Harmonic "felt kalimba" timbre, a detuned second voice, 6–16 ms raised-cosine attacks, nothing above A5, a small room reverb and a low-pass. Peaks are now −17 to −26 dBFS, at player volume 0.7.
- **Cropping fixed.** Scroll views were inset 20 pt and clipped anything outside them: the first and last aura swatches and their ring, and card shadows at the sides. `FormScroll`, the Chats and Agents lists, the chat transcript and the agent detail scroller are now full-bleed with the gutter inside. The agent detail page keeps its 24 pt inset. The living avatar's colour burst is limited to 1.45× so it stays inside its card.
- **Role chips.** "Start with a role" now appears only on a blank Create agent, not when the screen is opened from a template.

## Contrast (WCAG 2.x, normal-text threshold 4.5:1)

Solid palette pairs only. This does not cover rendered opacity, Dynamic Type or
screen readers.

| Mode  | Pair                   | Foreground | Background | Ratio   | Result |
| ----- | ---------------------- | ---------- | ---------- | ------- | ------ |
| light | Body ink               | #141A2E    | #FFFFFF    | 17.26:1 | Pass   |
| light | Secondary              | #4D5466    | #FFFFFF    | 7.57:1  | Pass   |
| light | Quiet                  | #6A7083    | #F7F8FA    | 4.64:1  | Pass   |
| light | Button label on accent | #FFFFFF    | #3358E0    | 5.81:1  | Pass   |
| light | Accent text on tint    | #2D4FCF    | #EBF0FF    | 5.89:1  | Pass   |
| light | Error                  | #B42907    | #FFFFFF    | 6.44:1  | Pass   |
| light | Success                | #087B65    | #FFFFFF    | 5.21:1  | Pass   |
| dark  | Body ink               | #EEF1F7    | #171B23    | 15.25:1 | Pass   |
| dark  | Secondary              | #A9B0C0    | #171B23    | 7.93:1  | Pass   |
| dark  | Quiet                  | #8A91A3    | #0F1218    | 5.95:1  | Pass   |
| dark  | Button label on accent | #FFFFFF    | #4466EE    | 4.79:1  | Pass   |
| dark  | Accent text on tint    | #93A8FF    | #1C2440    | 6.75:1  | Pass   |
| dark  | Error                  | #FF8A73    | #171B23    | 7.50:1  | Pass   |
| dark  | Success                | #3CCB9F    | #171B23    | 8.41:1  | Pass   |

## Build and release notes

- `scripts/ios-build-identity.py` and `scripts/android/build-identity.py` now
  look for `#F7F8FA` / `#3358E0` as palette markers in the bundle, replacing
  `#F9F9F8` / `#1E2B58`.
- `app.json` and the new `expo-system-ui` module change native inputs. A full
  native build through CI is needed; a JS-only reload of an existing build is
  not enough. With an older binary, the in-app Light/Dark choice still works,
  but "System" stays light on iOS because the old Info.plist pins light mode.

## Not yet verified

The changes have not yet been checked on a running device or simulator. Before
calling this complete, capture iOS and Android at equal widths in light and
dark mode for these screens: Chats (empty and populated), Agents (empty and
populated), Settings, chat while waiting and while streaming, the attachment
sheet, the model picker (including the PDF state), connection, agent detail
and edit, and report. Also check the largest accessibility text size and
Reduce Motion.
