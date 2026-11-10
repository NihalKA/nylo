import { Platform } from "react-native";
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { readPreference, writePreference } from "./storage";

// Nylo's UI sounds: soft pentatonic "glass marimba" tones synthesized by
// scripts/generate-ui-sounds.py. Each sound shares its name and rhythm with a
// haptic feel in src/haptics.ts, so touch and sound land together.
//
// Etiquette: sounds mix with the user's music instead of interrupting it, are
// silenced by the iPhone ring/silent switch, never play in the background, and
// can be turned off in Settings → Sound & touch.

const sources = {
  tick: require("../assets/sounds/tick.wav"),
  button: require("../assets/sounds/button.wav"),
  card: require("../assets/sounds/card.wav"),
  create: require("../assets/sounds/create.wav"),
  select: require("../assets/sounds/select.wav"),
  aura: require("../assets/sounds/aura.wav"),
  toggleOn: require("../assets/sounds/toggleOn.wav"),
  toggleOff: require("../assets/sounds/toggleOff.wav"),
  send: require("../assets/sounds/send.wav"),
  stop: require("../assets/sounds/stop.wav"),
  landed: require("../assets/sounds/landed.wav"),
  success: require("../assets/sounds/success.wav"),
  warn: require("../assets/sounds/warn.wav"),
  error: require("../assets/sounds/error.wav"),
} as const;
export type SoundName = keyof typeof sources;

const native = Platform.OS === "ios" || Platform.OS === "android";
const VOLUME = 0.7;
let enabled = true;
const players = new Map<SoundName, AudioPlayer>();
let session: Promise<void> | null = null;

const ready = readPreference("sounds")
  .then((value) => {
    enabled = value !== "off";
  })
  .catch(() => {});

export async function soundsEnabled() {
  await ready;
  return enabled;
}
export function setSoundsEnabled(value: boolean) {
  enabled = value;
  void writePreference("sounds", value ? "on" : "off").catch(() => {});
  if (value) warmUpSounds();
}

/** Configures the audio session once and preloads every sound. */
export function warmUpSounds() {
  if (!native || session) return;
  session = setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: "mixWithOthers",
    allowsRecording: false,
    shouldPlayInBackground: false,
  })
    .catch(() => {})
    .then(() => {
      for (const name of Object.keys(sources) as SoundName[]) {
        if (players.has(name)) continue;
        try {
          const player = createAudioPlayer(sources[name]);
          player.volume = VOLUME;
          players.set(name, player);
        } catch {
          // A missing sound must never break an interaction.
        }
      }
    });
}

export function playSound(name: SoundName) {
  if (!native || !enabled) return;
  const player = players.get(name);
  if (!player) {
    warmUpSounds();
    return;
  }
  try {
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // ignore: feedback is best-effort
  }
}
