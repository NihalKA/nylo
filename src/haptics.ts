import { Platform, Vibration } from "react-native";
import * as Haptics from "expo-haptics";
import { readPreference, writePreference } from "./storage";
import { SoundName, playSound } from "./sounds";

// Nylo's haptic vocabulary: each kind of interaction has its own feel, and
// each feel's sound (src/sounds.ts) shares its rhythm.
//
// iOS: Taptic Engine impact styles, selection and notifications.
// Android: explicit motor patterns via React Native's Vibration API. System
// haptic constants (performHapticFeedback) were tried first, but many are
// no-ops on Samsung One UI and others are gated by the system "touch
// interactions" setting, so they were not reliably felt. Explicit pulses are
// felt on every device. Feels differ in pulse length and rhythm. Requires the
// VIBRATE install-time permission (declared by expo-haptics; no prompt).

const { ImpactFeedbackStyle: Impact, NotificationFeedbackType: Note } = Haptics;

type Step =
  | { ios: "impact"; style: Haptics.ImpactFeedbackStyle }
  | { ios: "select" }
  | { ios: "note"; type: Haptics.NotificationFeedbackType };
type Feel = {
  ios: Step[];
  /** Milliseconds between iOS steps for multi-pulse feels. */
  gap?: number;
  /**
   * Android pattern: [wait, buzz, wait, buzz, …] in ms. Second pulses start at
   * the same offsets as the iOS steps and the second note of the sound.
   */
  android: number[];
};

const feels = {
  /** Small controls (back, close, icon actions): the crispest tick. */
  tick: { ios: [{ ios: "select" }], android: [0, 10] },
  /** Selection detents (tabs, appearance, suggestions). */
  select: { ios: [{ ios: "select" }], android: [0, 12] },
  /** Buttons: a light, firm press. */
  button: { ios: [{ ios: "impact", style: Impact.Light }], android: [0, 16] },
  /** Opening a card: a softer, slightly longer press. */
  card: { ios: [{ ios: "impact", style: Impact.Soft }], android: [0, 20] },
  /** Creating something new: a rounder, confident thump. */
  create: {
    ios: [{ ios: "impact", style: Impact.Medium }],
    android: [0, 30],
  },
  /** Choosing an aura colour: a click, then a bloom (70 ms). */
  aura: {
    ios: [
      { ios: "impact", style: Impact.Rigid },
      { ios: "impact", style: Impact.Soft },
    ],
    gap: 70,
    android: [0, 10, 60, 24],
  },
  /** Switches: on is firmer than off. */
  toggleOn: {
    ios: [{ ios: "impact", style: Impact.Medium }],
    android: [0, 22],
  },
  toggleOff: {
    ios: [{ ios: "impact", style: Impact.Light }],
    android: [0, 12],
  },
  /** Sending: firm press, then a light echo as it lifts away (90 ms). */
  send: {
    ios: [
      { ios: "impact", style: Impact.Medium },
      { ios: "impact", style: Impact.Soft },
    ],
    gap: 90,
    android: [0, 22, 68, 12],
  },
  /** Stopping a reply: one long, heavy press. */
  stop: { ios: [{ ios: "impact", style: Impact.Heavy }], android: [0, 48] },
  /** A reply landed: two gentle, settled pulses (110 ms). */
  landed: {
    ios: [
      { ios: "impact", style: Impact.Soft },
      { ios: "impact", style: Impact.Soft },
    ],
    gap: 110,
    android: [0, 14, 96, 18],
  },
  /** Scrolling past a card: the faintest texture. */
  scroll: { ios: [{ ios: "select" }], android: [0, 8] },
  /** Completed (copied, saved): short, then fuller (90 ms). */
  success: {
    ios: [{ ios: "note", type: Note.Success }],
    android: [0, 14, 76, 26],
  },
  /** Destructive or cautionary: two even, firm pulses (100 ms). */
  warn: {
    ios: [{ ios: "note", type: Note.Warning }],
    android: [0, 30, 70, 30],
  },
  /** Something failed: three pulses, the last longest. */
  error: {
    ios: [{ ios: "note", type: Note.Error }],
    android: [0, 24, 46, 24, 46, 40],
  },
} satisfies Record<string, Feel>;

export type HapticFeel = keyof typeof feels;

let enabled = true;
const ready = readPreference("haptics")
  .then((value) => {
    enabled = value !== "off";
  })
  .catch(() => {});

export async function hapticsEnabled() {
  await ready;
  return enabled;
}
export function setHapticsEnabled(value: boolean) {
  enabled = value;
  void writePreference("haptics", value ? "on" : "off").catch(() => {});
}

function runIos(step: Step) {
  if (step.ios === "select") return Haptics.selectionAsync();
  if (step.ios === "impact") return Haptics.impactAsync(step.style);
  return Haptics.notificationAsync(step.type);
}

// Feels that stay silent (pure texture).
const silent: HapticFeel[] = ["scroll"];

/**
 * Plays a feel: its haptic pattern (if vibration is on) and its matching
 * sound (if sounds are on). Both start together and share the same rhythm.
 */
export function play(feel: HapticFeel) {
  if (!silent.includes(feel)) playSound(feel as SoundName);
  if (!enabled) return;
  const spec: Feel = feels[feel];
  try {
    if (Platform.OS === "android") {
      Vibration.vibrate(spec.android);
    } else if (Platform.OS === "ios") {
      const gap = spec.gap ?? 0;
      spec.ios.forEach((step, i) => {
        const go = () => void runIos(step).catch(() => {});
        if (i) setTimeout(go, gap * i);
        else go();
      });
    }
  } catch {
    // Feedback is best-effort and must never break an interaction.
  }
}

/** Shorthand: `haptic.card()`, `haptic.send()`, … */
export const haptic = Object.fromEntries(
  (Object.keys(feels) as HapticFeel[]).map((feel) => [feel, () => play(feel)]),
) as Record<HapticFeel, () => void>;

/**
 * Returns an onScroll handler that gives a faint tick each time the list
 * moves past another `step` points, throttled so it reads as texture.
 */
export function scrollTicker(step = 96) {
  let lastIndex = 0;
  let lastAt = 0;
  return (y: number) => {
    const index = Math.max(0, Math.floor(y / step));
    if (index === lastIndex) return;
    lastIndex = index;
    const now = Date.now();
    if (now - lastAt < 80 || y <= 0) return;
    lastAt = now;
    play("scroll");
  };
}
