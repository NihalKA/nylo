import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { HapticFeel, play } from "./haptics";

// Small, calm motion vocabulary shared by iOS and Android. Everything runs on
// the native driver (transform/opacity only) and collapses to a static state
// when the OS "Reduce Motion" setting is on.

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => live && setReduced(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A Pressable that gently compresses while held and springs back on release.
 * Use a static `style` (not a function); press feedback is the animation.
 */
export function Tappable({
  style,
  scaleTo = 0.97,
  ripple,
  feel,
  onPress,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  /** Soft colour that blooms outward from the exact touch point. */
  ripple?: string;
  /** Haptic + sound played when the press lands. */
  feel?: HapticFeel;
  children?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const press = useRef(new Animated.Value(0)).current;
  const bloom = useRef(new Animated.Value(1)).current;
  const self = useRef<React.ComponentRef<typeof View>>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const to = (value: number) =>
    Animated.spring(press, {
      toValue: value,
      useNativeDriver: true,
      speed: value ? 50 : 22,
      bounciness: value ? 0 : 7,
    }).start();
  const flat = StyleSheet.flatten(style);
  const baseOpacity = flat?.opacity ?? 1;
  const startRipple = (e: GestureResponderEvent) => {
    if (!ripple || reduced) return;
    const { pageX, pageY } = e.nativeEvent;
    // Measure ourselves so nested text doesn't skew the touch origin.
    self.current?.measure(
      (
        _x: number,
        _y: number,
        _w: number,
        _h: number,
        left: number,
        top: number,
      ) => {
        setOrigin({ x: pageX - left, y: pageY - top });
        bloom.setValue(0);
        Animated.timing(bloom, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    );
  };
  const R = 260;
  return (
    <AnimatedPressable
      {...rest}
      ref={self}
      onPress={
        onPress
          ? (e: GestureResponderEvent) => {
              if (feel) play(feel);
              onPress(e);
            }
          : undefined
      }
      onPressIn={(e: GestureResponderEvent) => {
        to(1);
        startRipple(e);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        to(0);
        onPressOut?.(e);
      }}
      style={[
        style,
        {
          opacity: press.interpolate({
            inputRange: [0, 1],
            outputRange: [
              Number(baseOpacity),
              Number(baseOpacity) * (reduced ? 0.6 : 0.88),
            ],
          }),
          transform: [
            {
              scale: press.interpolate({
                inputRange: [0, 1],
                outputRange: [1, reduced ? 1 : scaleTo],
              }),
            },
          ],
        },
      ]}
    >
      {ripple && origin ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: flat?.borderRadius,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              left: origin.x - R,
              top: origin.y - R,
              width: R * 2,
              height: R * 2,
              borderRadius: R,
              backgroundColor: ripple,
              opacity: bloom.interpolate({
                inputRange: [0, 1],
                outputRange: [0.32, 0],
              }),
              transform: [
                {
                  scale: bloom.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.05, 1],
                  }),
                },
              ],
            }}
          />
        </View>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

/** A one-shot ring that bursts outward each time `count` increases. */
export function Burst({
  count,
  color,
  size,
  spread = 2,
}: {
  count: number;
  color: string;
  size: number;
  /** How far the ring travels, as a multiple of `size`. */
  spread?: number;
}) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) return;
    value.setValue(0);
    Animated.timing(value, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [count]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 0],
        }),
        transform: [
          {
            scale: value.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, spread],
            }),
          },
        ],
      }}
    />
  );
}

/** Fades and lifts content into place once, on mount. */
export function FadeIn({
  children,
  delay = 0,
  distance = 10,
  duration = 280,
  enabled = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const animate = enabled && !reduced;
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Springs in from slightly smaller whenever `trigger` flips to true. */
export function PopIn({
  trigger,
  children,
  style,
}: {
  trigger: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!trigger || reduced) return;
    scale.setValue(0.72);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 12,
    }).start();
  }, [trigger]);
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** Three softly bouncing dots: the "reply is on its way" loader. */
export function TypingDots({
  color,
  size = 7,
}: {
  color: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (reduced) return;
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 140 + 220),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduced]);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: size * 0.6,
        height: size * 2.6,
      }}
    >
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: dot.interpolate({
              inputRange: [0, 1],
              outputRange: [reduced ? 0.7 : 0.35, 1],
            }),
            transform: [
              {
                translateY: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -size * 0.7],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** A soft ring that breathes outward from a control while work is running. */
export function PulseRing({
  color,
  size,
  active = true,
}: {
  color: string;
  size: number;
  active?: boolean;
}) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduced) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [active, reduced]);
  if (!active || reduced) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 0],
        }),
        transform: [
          {
            scale: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.55],
            }),
          },
        ],
      }}
    />
  );
}

/** Gentle opacity breathing for a status label. */
export function Breathe({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);
  return <Animated.View style={{ opacity: value }}>{children}</Animated.View>;
}
