import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardEvent,
  Platform,
  ScaledSize,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "./motion";
import { keyboardLiftFor } from "./keyboard-math";

// iOS moves its keyboard on this curve; matching it keeps the composer glued
// to the top of the keyboard instead of chasing it.
const iosKeyboardCurve = Easing.bezier(0.38, 0.7, 0.125, 1);
const androidCurve = Easing.bezier(0.45, 0, 0.15, 1);
/**
 * How far the chat must rise so the composer sits just above the keyboard,
 * on iOS and on edge-to-edge Android (where the window is not resized).
 * Apply it as `paddingBottom` on the view holding messages + composer, and
 * pass that view's ref so iOS can measure exactly.
 */
export function useKeyboardLift(
  container?: React.RefObject<React.ComponentRef<typeof View> | null>,
) {
  const { bottom } = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const lift = useRef(new Animated.Value(0)).current;
  const baseHeight = useRef(Dimensions.get("window").height);
  const safeBottom = useRef(bottom);
  safeBottom.current = bottom;
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const move = (to: number, duration: number) =>
      Animated.timing(lift, {
        toValue: to,
        duration: reduced ? 0 : ios ? duration : Math.max(duration, 220),
        easing: ios ? iosKeyboardCurve : androidCurve,
        useNativeDriver: false,
      }).start();
    const show = (e: KeyboardEvent) => {
      const keyboardHeight = e.endCoordinates.height;
      const base = {
        platform: Platform.OS,
        keyboardHeight,
        keyboardTop: e.endCoordinates.screenY,
        safeBottom: safeBottom.current,
        windowShrunk:
          !ios &&
          baseHeight.current - Dimensions.get("window").height >
            keyboardHeight * 0.5,
      };
      const node = container?.current;
      if (ios && node)
        // The container's own frame does not change with its padding, so
        // its measured bottom is where the composer would be without a lift.
        node.measureInWindow((_x, y, _w, h) =>
          move(
            keyboardLiftFor({
              ...base,
              containerBottom: h > 0 ? y + h : undefined,
            }),
            e.duration || 250,
          ),
        );
      else move(keyboardLiftFor(base), e.duration || 250);
    };
    const hide = (e?: KeyboardEvent) => move(0, e?.duration || 220);
    const subs = ios
      ? [
          Keyboard.addListener("keyboardWillShow", show),
          Keyboard.addListener("keyboardWillChangeFrame", (e) => {
            // Ignore the frame change that accompanies hiding.
            if (e.endCoordinates.screenY < Dimensions.get("screen").height)
              show(e);
          }),
          Keyboard.addListener("keyboardWillHide", hide),
        ]
      : [
          Keyboard.addListener("keyboardDidShow", show),
          Keyboard.addListener("keyboardDidHide", hide),
        ];
    const dims = Dimensions.addEventListener(
      "change",
      ({ window }: { window: ScaledSize }) => {
        if (!Keyboard.isVisible()) baseHeight.current = window.height;
      },
    );
    return () => {
      subs.forEach((s) => s.remove());
      dims.remove();
    };
  }, [reduced]);
  return lift;
}
