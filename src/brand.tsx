import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, ViewStyle } from "react-native";
import { theme, useTheme } from "./theme";
import { useReducedMotion } from "./motion";
import { rgba } from "./organic";

// Brand layer: the Nylo logo (owner-supplied artwork, 11 Nov 2026) and its
// teal → blue → violet → pink ribbon. Used sparingly as an accent; it never
// replaces the app palette in theme.tsx.

export const brandStops = ["#34D8C5", "#4C7CF3", "#8B5CF6", "#E25BC8"];

/** The logo ribbon as a CSS gradient (React Native `backgroundImage`). */
export function brandGradient(angle = 90, alpha = 1) {
  const n = brandStops.length - 1;
  const stops = brandStops
    .map((c, i) => `${rgba(c, alpha)} ${Math.round((i / n) * 100)}%`)
    .join(", ");
  return `linear-gradient(${angle}deg, ${stops})`;
}

const MARK = require("../assets/brand/mark.png");
const MARK_RATIO = 1.5287;
const WORDMARK = require("../assets/brand/wordmark.png");
const WORDMARK_RATIO = 2.4658;

/** The infinity-bubble mark. Optionally floats gently (static under Reduce Motion). */
export function BrandMark({
  height = 24,
  float,
  style,
}: {
  height?: number;
  float?: boolean;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!float || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, reduced]);
  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        float
          ? {
              transform: [
                {
                  translateY: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            }
          : null,
        style,
      ]}
    >
      <Image
        source={MARK}
        accessible={false}
        resizeMode="contain"
        style={{ width: height * MARK_RATIO, height }}
      />
    </Animated.View>
  );
}

/** "Nylo" in the logo's own lettering, tinted to the current ink colour. */
export function BrandWordmark({
  height = 20,
  color,
}: {
  height?: number;
  color?: string;
}) {
  useTheme();
  return (
    <Image
      source={WORDMARK}
      accessibilityRole="image"
      accessibilityLabel="Nylo"
      resizeMode="contain"
      style={{
        width: height * WORDMARK_RATIO,
        height,
        tintColor: color || theme.ink,
      }}
    />
  );
}

function hexAt(t: number) {
  // Position t (0..1) along the brand stops, as an interpolated #rrggbb.
  const n = brandStops.length - 1;
  const i = Math.min(n - 1, Math.floor(t * n));
  const f = t * n - i;
  const a = parseInt(brandStops[i].slice(1), 16);
  const b = parseInt(brandStops[i + 1].slice(1), 16);
  const ch = (s: number) =>
    Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/**
 * The logo ribbon dissolving into nothing at both ends: colour runs through
 * the brand stops while opacity follows a smooth bell (0 → 1 → 0).
 */
export function fadedBrandGradient(angle = 90) {
  const steps = 12;
  const stops = Array.from({ length: steps + 1 }, (_, k) => {
    const t = k / steps;
    const alpha = Math.pow(Math.sin(Math.PI * t), 1.6);
    return `${rgba(hexAt(t), Number(alpha.toFixed(3)))} ${Math.round(t * 100)}%`;
  });
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

/** A thin ribbon of the logo gradient. Decorative. */
export function BrandLine({
  height = 2,
  opacity,
  fade,
  style,
}: {
  height?: number;
  opacity?: number;
  /** Dissolve into transparency towards both ends. */
  fade?: boolean;
  style?: ViewStyle;
}) {
  const { scheme } = useTheme();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height,
          borderRadius: height,
          // no solid underlay when fading, or it would show at the ends
          backgroundColor: fade ? "transparent" : brandStops[1],
          backgroundImage: fade ? fadedBrandGradient(90) : brandGradient(90),
          opacity: opacity ?? (scheme === "dark" ? 0.75 : 0.6),
        },
        style,
      ]}
    />
  );
}
