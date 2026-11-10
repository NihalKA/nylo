import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme, useTheme } from "./theme";
import { useReducedMotion } from "./motion";

// Organic layer: soft light and slow movement instead of extra UI. Gradients
// use React Native's native `backgroundImage` (iOS + Android, no extra deps).

export function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
function mix(hex: string, target: string, amount: number) {
  const a = parseInt(hex.slice(1, 7), 16);
  const b = parseInt(target.slice(1, 7), 16);
  const ch = (shift: number) =>
    Math.round(
      ((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount,
    );
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** The signature blue → violet fill for primary actions. */
export function accentGradient(): ViewStyle {
  return {
    backgroundColor: theme.primary,
    backgroundImage: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent2} 100%)`,
  };
}
/** A soft, lit fill derived from any base colour (agent avatars). */
export function softGradient(color: string): ViewStyle {
  return {
    backgroundColor: color,
    backgroundImage: `linear-gradient(145deg, ${mix(color, "#FFFFFF", 0.28)} 0%, ${color} 70%)`,
  };
}

type Mood = { name: string; greeting: string; colors: [string, string] };
/** Light changes through the day, like a window. */
export function dayMood(date = new Date()): Mood {
  const h = date.getHours();
  if (h >= 5 && h < 12)
    return {
      name: "morning",
      greeting: "Good morning",
      colors: ["#FFB88A", "#8FB8FF"],
    };
  if (h >= 12 && h < 17)
    return {
      name: "day",
      greeting: "Good afternoon",
      colors: ["#7CC4FF", "#7FE3C8"],
    };
  if (h >= 17 && h < 21)
    return {
      name: "evening",
      greeting: "Good evening",
      colors: ["#B79CFF", "#FF9EC4"],
    };
  return {
    name: "night",
    greeting: "Still up?",
    colors: ["#7C8CFF", "#5ED6D0"],
  };
}

function Blob({
  color,
  alpha,
  size,
  style,
  drift,
  direction,
}: {
  color: string;
  alpha: number;
  size: number;
  style: ViewStyle;
  drift: Animated.Value;
  direction: 1 | -1;
}) {
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundImage: `radial-gradient(circle at center, ${rgba(color, alpha)} 0%, ${rgba(color, 0)} 68%)`,
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 36 * direction],
              }),
            },
            {
              translateY: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 18 * -direction],
              }),
            },
            {
              scale: drift.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.08, 1],
              }),
            },
          ],
        },
        style,
      ]}
    />
  );
}

/**
 * Two slow-drifting colour clouds behind a page header. Purely decorative,
 * low opacity, hidden from accessibility, static under Reduce Motion.
 */
export function Aura({
  height = 300,
  scrollY,
}: {
  height?: number;
  scrollY?: Animated.Value;
}) {
  const { scheme } = useTheme();
  const reduced = useReducedMotion();
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);
  const [a, b] = dayMood().colors;
  const alpha = scheme === "dark" ? 0.22 : 0.42;
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: "hidden",
        ...(scrollY
          ? {
              opacity: scrollY.interpolate({
                inputRange: [0, 220],
                outputRange: [1, 0.2],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-100, 0, 220],
                    outputRange: [30, 0, -90],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }
          : {}),
      }}
    >
      <Blob
        color={a}
        alpha={alpha}
        size={340}
        drift={drift}
        direction={1}
        style={{ top: -170, left: -120 }}
      />
      <Blob
        color={b}
        alpha={alpha}
        size={300}
        drift={drift}
        direction={-1}
        style={{ top: -130, right: -110 }}
      />
    </Animated.View>
  );
}

/**
 * The thinking orb: two lit blobs orbiting inside a breathing sphere, so the
 * shape gently morphs while a reply is on its way.
 */
export function ThinkingOrb({ size = 26 }: { size?: number }) {
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    breatheLoop.start();
    return () => {
      spinLoop.stop();
      breatheLoop.stop();
    };
  }, [reduced]);
  const blob = (color: string, offset: number): ViewStyle => ({
    position: "absolute",
    width: size * 0.78,
    height: size * 0.78,
    borderRadius: size,
    backgroundImage: `radial-gradient(circle at center, ${rgba(color, 0.95)} 0%, ${rgba(color, 0)} 72%)`,
    transform: [{ translateX: offset }],
  });
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size * 1.5,
        height: size * 1.5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* halo */}
      <Animated.View
        style={{
          position: "absolute",
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: size,
          backgroundImage: `radial-gradient(circle at center, ${rgba(theme.accent2, 0.25)} 0%, ${rgba(theme.accent2, 0)} 70%)`,
          opacity: breathe.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
          transform: [
            {
              scale: breathe.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1.15],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: rgba(theme.primary, 0.9),
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
            {
              scale: breathe.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1.06],
              }),
            },
          ],
        }}
      >
        <View style={blob(theme.accent2, -size * 0.22)} />
        <View style={blob(theme.accent3, size * 0.24)} />
        <View
          style={{
            position: "absolute",
            top: size * 0.14,
            left: size * 0.22,
            width: size * 0.3,
            height: size * 0.2,
            borderRadius: size,
            backgroundColor: "rgba(255,255,255,0.45)",
          }}
        />
      </Animated.View>
    </View>
  );
}

/** A softly glowing icon that floats — used for empty states. */
export function GlowIcon({
  name,
  size = 76,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
}) {
  const reduced = useReducedMotion();
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.38,
        alignItems: "center",
        justifyContent: "center",
        ...accentGradient(),
        boxShadow: `0px 12px 28px -8px ${rgba(theme.accent2, 0.45)}`,
        transform: [
          {
            translateY: float.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -6],
            }),
          },
          {
            rotate: float.interpolate({
              inputRange: [0, 1],
              outputRange: ["-3deg", "3deg"],
            }),
          },
        ],
      }}
    >
      <Ionicons name={name} size={size * 0.44} color={theme.onPrimary} />
    </Animated.View>
  );
}

// ── Generative avatars ──────────────────────────────────────────────────────
// Each agent gets a unique mesh gradient: its chosen colour plus two companion
// hues, with blob positions seeded from its name. Stable for a given agent,
// distinct between agents, and needs no image assets.

function hashSeed(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
function hsla(h: number, s: number, l: number, a: number) {
  return `hsla(${Math.round(((h % 360) + 360) % 360)}, ${Math.round(Math.min(1, s) * 100)}%, ${Math.round(Math.min(1, Math.max(0, l)) * 100)}%, ${a})`;
}

/** Mesh-gradient fill for an agent avatar, seeded by the agent's name. */
export function meshAvatar(color: string, seed: string): ViewStyle {
  const [h, s, l] = toHsl(color);
  const r = hashSeed(seed || "agent");
  const pick = (shift: number, span: number) =>
    ((r >>> shift) % span) - span / 2;
  const sat = Math.min(0.85, Math.max(0.45, s + 0.15));
  const hueA = h + 40 + pick(0, 30); // warm-side companion
  const hueB = h - 50 + pick(5, 30); // cool-side companion
  const pos = (shift: number) => 15 + ((r >>> shift) % 70);
  return {
    backgroundColor: color,
    backgroundImage: [
      `radial-gradient(circle at ${pos(2)}% ${pos(9)}%, ${hsla(hueA, sat, Math.min(0.78, l + 0.32), 0.95)} 0%, ${hsla(hueA, sat, l + 0.2, 0)} 55%)`,
      `radial-gradient(circle at ${pos(13)}% ${pos(19)}%, ${hsla(hueB, sat, Math.min(0.7, l + 0.18), 0.9)} 0%, ${hsla(hueB, sat, l, 0)} 60%)`,
      `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%)`,
    ].join(", "),
  };
}

/** A small glowing caret that breathes at the end of a streaming reply. */
export function StreamCaret() {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: -4,
        ...accentGradient(),
        boxShadow: `0px 0px 10px ${rgba(theme.accent2, 0.6)}`,
        opacity: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.45, 1],
        }),
        transform: [
          {
            scale: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.15],
            }),
          },
        ],
      }}
    />
  );
}
