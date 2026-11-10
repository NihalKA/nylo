import React from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextProps,
  TextInputProps,
  TextStyle,
} from "react-native";

// Static weights give Android and iOS the same font programs and metrics.
export const fontAssets = {
  NyloBody400Italic: require("../assets/fonts/Inter-400Italic.ttf"),
  NyloBody400: require("../assets/fonts/Inter-400.ttf"),
  NyloBody500: require("../assets/fonts/Inter-500.ttf"),
  NyloBody600: require("../assets/fonts/Inter-600.ttf"),
  NyloBody700: require("../assets/fonts/Inter-700.ttf"),
  NyloHeading500: require("../assets/fonts/PlusJakartaSans-500.ttf"),
  NyloHeading600: require("../assets/fonts/PlusJakartaSans-600.ttf"),
  NyloHeading700: require("../assets/fonts/PlusJakartaSans-700.ttf"),
  NyloNimbus400: require("../assets/fonts/NimbusSans-Regular.ttf"),
  NyloNimbus700: require("../assets/fonts/NimbusSans-Bold.ttf"),
  NyloMono400: require("../assets/fonts/LiberationMono-Regular.ttf"),
  NyloMono700: require("../assets/fonts/LiberationMono-Bold.ttf"),
};

export const fonts = {
  body: "NyloBody400",
  heading: "NyloHeading600",
  nimbus: "NyloNimbus400",
  mono: "NyloMono400",
};

function fontStyle(style: TextStyle = {}): TextStyle {
  const weight =
    style.fontWeight === "bold" ? 700 : Number(style.fontWeight || 400);
  const requested = style.fontFamily || fonts.body;
  const bodyItalic =
    requested.startsWith("NyloBody") && style.fontStyle === "italic";
  const family = bodyItalic
    ? "NyloBody400Italic"
    : requested.startsWith("NyloHeading")
      ? `NyloHeading${weight >= 700 ? 700 : weight >= 600 ? 600 : 500}`
      : requested.startsWith("NyloNimbus")
        ? `NyloNimbus${weight >= 600 ? 700 : 400}`
        : requested.startsWith("NyloMono")
          ? `NyloMono${weight >= 600 ? 700 : 400}`
          : requested.startsWith("NyloBody")
            ? `NyloBody${weight >= 700 ? 700 : weight >= 600 ? 600 : weight >= 500 ? 500 : 400}`
            : requested;
  return {
    fontFamily: family,
    fontWeight: "normal",
    ...(bodyItalic ? { fontStyle: "normal" as const } : {}),
  };
}

export const Text = React.forwardRef<
  React.ComponentRef<typeof NativeText>,
  TextProps
>(function Text({ style, ...props }, ref) {
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[style, fontStyle(StyleSheet.flatten(style) || {})]}
    />
  );
});

export const TextInput = React.forwardRef<
  React.ComponentRef<typeof NativeTextInput>,
  TextInputProps
>(function TextInput({ style, ...props }, ref) {
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      style={[style, fontStyle(StyleSheet.flatten(style) || {})]}
    />
  );
});
