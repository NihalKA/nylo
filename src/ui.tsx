import { Text, TextInput, fonts } from "./typography";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ColorValue,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DesignIcon, DesignIconName } from "./design-icons";
import { router, useSegments } from "expo-router";
import { Agent, Conversation } from "./types";
import { plainTextPreview } from "./domain";
import { Palette, onSchemeApplied, theme, useTheme } from "./theme";
import { Burst, Tappable, useReducedMotion } from "./motion";
import { Aura, ThinkingOrb, accentGradient, meshAvatar, rgba } from "./organic";
import { HapticFeel, haptic, play } from "./haptics";
import { BrandLine } from "./brand";

export { haptic } from "./haptics";

export { theme, useTheme } from "./theme";
export {
  Aura,
  GlowIcon,
  ThinkingOrb,
  accentGradient,
  dayMood,
  rgba,
  softGradient,
  meshAvatar,
  StreamCaret,
} from "./organic";
export {
  Tappable,
  FadeIn,
  PopIn,
  TypingDots,
  PulseRing,
  Breathe,
  Burst,
} from "./motion";
export {
  BrandMark,
  BrandWordmark,
  BrandLine,
  brandGradient,
  brandStops,
  fadedBrandGradient,
} from "./brand";

// Shared by iOS and Android. Layout follows the Figma reference
// (WNCRguvh0wqYTgBUlbXZ9G); colour, cards and motion follow the owner-requested
// "Fresh" extension documented in docs/design/fresh-theme-extension.md.

const makeShadow = (p: Palette) => ({
  shadowColor: p.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: p.shadow === "#000000" ? 0.3 : 0.06,
  shadowRadius: 8,
  elevation: 1,
});
export const softShadow = makeShadow(theme);

const makeStyles = (p: Palette) => ({
  page: { flex: 1, backgroundColor: p.bg },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 576,
    alignSelf: "center",
    paddingHorizontal: 20,
  } as ViewStyle,
  row: { flexDirection: "row", alignItems: "center" } as ViewStyle,
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as ViewStyle,
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: "700",
    color: p.ink,
    letterSpacing: -0.7,
  } as TextStyle,
  h2: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: "600",
    color: p.ink,
    letterSpacing: -0.4,
  } as TextStyle,
  text: { fontSize: 16, lineHeight: 24, color: p.ink } as TextStyle,
  sub: { fontSize: 14, lineHeight: 21, color: p.sub } as TextStyle,
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: p.sub,
    textTransform: "uppercase",
  } as TextStyle,
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: p.card,
    borderWidth: 1,
    borderColor: p.hairline,
    boxShadow: p.cardShadow,
  } as ViewStyle,
  gap: { gap: 16 } as ViewStyle,
  section: { marginTop: 28, marginBottom: 14 } as ViewStyle,
  input: {
    borderWidth: 1,
    borderColor: p.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: p.surface,
    fontSize: 16,
    color: p.ink,
    minHeight: 48,
  } as TextStyle,
  error: { color: p.error, fontSize: 13, lineHeight: 20 } as TextStyle,
});
// A plain object (not StyleSheet.create) so its entries can be swapped when
// the appearance changes; callers keep importing `s`.
export const s = makeStyles(theme);
onSchemeApplied(() => {
  Object.assign(s, makeStyles(theme));
  Object.assign(softShadow, makeShadow(theme));
});

export function Icon({
  name,
  size = 20,
  color,
  design,
  tint,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: ColorValue;
  design?: DesignIconName;
  /** Recolours a design icon; by default it follows its palette role. */
  tint?: string;
}) {
  if (design) return <DesignIcon name={design} tint={tint} />;
  return (
    <Ionicons
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={name}
      size={size}
      color={typeof color === "string" ? color : theme.ink}
    />
  );
}
export function NyloMark({ size = 52 }: { size?: number }) {
  return (
    <Image
      source={require("../assets/icon.png")}
      accessible={false}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
    />
  );
}
export function Page({
  children,
  aura,
  scrollY,
}: {
  children: React.ReactNode;
  /** Soft, time-of-day light behind the header (top-level screens). */
  aura?: boolean;
  /** Content scroll offset; the aura drifts away and fades as you scroll. */
  scrollY?: Animated.Value;
}) {
  useTheme();
  const segments = useSegments();
  return (
    <SafeAreaView
      edges={
        segments[0] === "(tabs)"
          ? ["top", "left", "right"]
          : ["top", "left", "right", "bottom"]
      }
      style={s.page}
    >
      {aura ? <Aura scrollY={scrollY} /> : null}
      <View style={s.shell}>{children}</View>
    </SafeAreaView>
  );
}
export function Header({
  title,
  right,
  titleStyle,
  dismissKeyboard,
  onDismissKeyboard,
  centerTitle = false,
  backDesign = "back",
}: {
  title: string;
  right?: React.ReactNode;
  titleStyle?: TextStyle;
  dismissKeyboard?: boolean;
  onDismissKeyboard?: () => void;
  centerTitle?: boolean;
  backDesign?: DesignIconName;
}) {
  return (
    <View style={[s.between, { minHeight: 56, marginHorizontal: -12 }]}>
      <IconButton
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        design={backDesign}
        label="Go back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        maxFontSizeMultiplier={1.6}
        style={[
          s.h2,
          {
            flex: 1,
            textAlign: centerTitle ? "center" : "left",
            lineHeight: 28,
          },
          titleStyle,
        ]}
      >
        {title}
      </Text>
      <View style={[s.row, { minWidth: 44 }]}>
        {dismissKeyboard ? (
          <KeyboardDismissButton onDismiss={onDismissKeyboard} />
        ) : null}
        {right}
      </View>
    </View>
  );
}
export function KeyboardDismissButton({
  onDismiss,
}: { onDismiss?: () => void } = {}) {
  const [visible, setVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible ? (
    <IconButton
      name="chevron-down"
      label="Dismiss keyboard"
      onPress={onDismiss || Keyboard.dismiss}
    />
  ) : null;
}

export function Switch({
  value,
  onValueChange,
  accessibilityLabel,
  disabled,
  trackColor,
  checkedThumb,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  trackColor?: { false?: string; true?: string };
  checkedThumb?: boolean;
}) {
  const reduced = useReducedMotion();
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) position.setValue(value ? 1 : 0);
    else
      Animated.spring(position, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 6,
      }).start();
  }, [value, reduced]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        if (value) haptic.toggleOff();
        else haptic.toggleOn();
        onValueChange(!value);
      }}
      style={{
        minWidth: 48,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          backgroundColor: value
            ? trackColor?.true || theme.green
            : trackColor?.false || theme.lineStrong,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left: 2,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            boxShadow: "0px 1px 3px rgba(0,0,0,0.18)",
            transform: [
              {
                translateX: position.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 20],
                }),
              },
            ],
          }}
        />
        {value && checkedThumb ? (
          <View
            style={{
              position: "absolute",
              right: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DesignIcon name="checkedThumb" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function IconButton({
  name,
  label,
  onPress,
  color,
  disabled,
  size = 20,
  design,
  tint,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color?: ColorValue;
  disabled?: boolean;
  size?: number;
  design?: DesignIconName;
  tint?: string;
}) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      feel="tick"
      scaleTo={0.86}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Icon name={name} design={design} size={size} color={color} tint={tint} />
    </Tappable>
  );
}

/** A filled, circular accent action used for page-level "create" buttons. */
export function FabButton({
  name,
  label,
  onPress,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.create();
        onPress();
      }}
      scaleTo={0.88}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        ...accentGradient(),
        boxShadow: theme.raisedShadow,
      }}
    >
      <Ionicons
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        name={name}
        size={22}
        color={theme.onPrimary}
      />
    </Tappable>
  );
}

/**
 * Drop-in Pressable that adds Nylo's sound + vibration. Keeps Pressable's
 * function styles. The feel defaults from the accessibility role: selection
 * controls (radio, tab, checkbox) click like a dial, everything else presses
 * like a button. Use `feel="none"` for silent dismiss areas.
 */
export function Press({
  feel,
  onPress,
  ...props
}: React.ComponentProps<typeof Pressable> & { feel?: HapticFeel | "none" }) {
  const role = props.accessibilityRole;
  const resolved: HapticFeel | "none" =
    feel ??
    (role === "radio" || role === "tab" || role === "checkbox"
      ? "select"
      : "button");
  return (
    <Pressable
      {...props}
      onPress={
        onPress
          ? (e) => {
              if (resolved !== "none") play(resolved);
              onPress(e);
            }
          : undefined
      }
    />
  );
}

export function MainNavigation({
  active,
}: {
  active: "chats" | "agents" | "settings";
}) {
  const destinations = [
    {
      key: "chats",
      label: "Chats",
      icon: "chatbox-outline",
      selectedIcon: "chatbox",
      path: "/",
    },
    {
      key: "agents",
      label: "Agents",
      icon: "people-outline",
      selectedIcon: "people",
      path: "/(tabs)/agents",
    },
    {
      key: "settings",
      label: "Settings",
      icon: "settings-outline",
      selectedIcon: "settings",
      path: "/(tabs)/settings",
    },
  ] as const;
  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: -20,
        backgroundColor: theme.bg,
        paddingHorizontal: 24,
      }}
    >
      <BrandLine
        fade
        height={1}
        style={{ position: "absolute", top: 0, left: "4%", right: "4%" }}
      />
      {destinations.map((item) => {
        const selected = active === item.key;
        const color = selected ? theme.accentText : theme.quiet;
        return (
          <Pressable
            key={item.key}
            testID={`detail-tab-${item.key}`}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptic.select();
              router.navigate(item.path);
            }}
            style={{
              flex: 1,
              minHeight: 49,
              paddingVertical: 4,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <TabPill
              focused={selected}
              name={selected ? item.selectedIcon : item.icon}
              color={color}
            />
            <Text
              maxFontSizeMultiplier={1.6}
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.33,
                color,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tab icon with a soft accent pill that springs in when selected. */
export function TabPill({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: ColorValue;
  focused: boolean;
}) {
  const tint = typeof color === "string" ? color : theme.accentText;
  const reduced = useReducedMotion();
  const on = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) on.setValue(focused ? 1 : 0);
    else
      Animated.spring(on, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }).start();
  }, [focused, reduced]);
  const design: DesignIconName | undefined = name.startsWith("chatbox")
    ? focused
      ? undefined
      : "tabChats"
    : name.startsWith("people")
      ? focused
        ? "tabAgentsActive"
        : "tabAgents"
      : focused
        ? "tabSettingsActive"
        : "tabSettings";
  return (
    <View
      style={{
        width: 56,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 56,
          height: 28,
          borderRadius: 14,
          backgroundColor: theme.selected,
          opacity: on,
          transform: [
            {
              scaleX: on.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          transform: [
            {
              scale: on.interpolate({
                inputRange: [0, 0.6, 1],
                outputRange: [1, 1.16, 1],
              }),
            },
          ],
        }}
      >
        <Icon name={name} design={design} size={22} color={tint} tint={tint} />
      </Animated.View>
    </View>
  );
}

export function Button({
  title,
  accessibilityLabel,
  onPress,
  secondary,
  destructive,
  disabled,
  icon,
  loading,
  style,
  textStyle,
  iconPosition = "start",
  designIcon,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconPosition?: "start" | "end";
  designIcon?: DesignIconName;
}) {
  const foreground = disabled
    ? theme.disabledText
    : secondary
      ? destructive
        ? theme.error
        : theme.ink
      : theme.onPrimary;
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{
        disabled: !!(disabled || loading),
        busy: !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      feel={destructive ? "warn" : "button"}
      style={[
        {
          ...(secondary || destructive || disabled
            ? {}
            : { boxShadow: theme.raisedShadow }),
          minHeight: 48,
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 24,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary
            ? destructive
              ? theme.errorSurface
              : theme.card
            : destructive
              ? theme.error
              : theme.primary,
          borderWidth: secondary ? 1 : 0,
          borderColor: destructive ? theme.errorSurface : theme.line,
          ...(!secondary && !destructive && !disabled ? accentGradient() : {}),
          ...(disabled ? { backgroundColor: theme.disabled } : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : icon && iconPosition === "start" ? (
        <Icon name={icon} design={designIcon} color={foreground} size={17} />
      ) : null}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          letterSpacing: 0.14,
          color: foreground,
          ...textStyle,
        }}
      >
        {title}
      </Text>
      {!loading && icon && iconPosition === "end" ? (
        <Icon name={icon} design={designIcon} color={foreground} size={17} />
      ) : null}
    </Tappable>
  );
}
export function Field({
  label,
  help,
  labelStyle,
  inputHint,
  gap = 7,
  ...props
}: TextInputProps & {
  label: string;
  help?: string;
  labelStyle?: TextStyle;
  inputHint?: string;
  gap?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap }}>
      <Text
        style={[
          { fontSize: 14, fontWeight: "600", color: theme.ink },
          labelStyle,
        ]}
      >
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.quiet}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            s.input,
            props.multiline
              ? { minHeight: 100, textAlignVertical: "top" }
              : null,
            props.style,
            focused ? { borderColor: theme.primary } : null,
          ]}
        />
        {inputHint ? (
          <Text
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "600",
              letterSpacing: 0.33,
              color: theme.quiet,
            }}
          >
            {inputHint}
          </Text>
        ) : null}
      </View>
      {help ? (
        <Text
          style={[s.sub, { fontSize: 12, lineHeight: 18, color: theme.quiet }]}
        >
          {help}
        </Text>
      ) : null}
    </View>
  );
}
export function Badge({
  text,
  icon = "phone-portrait-outline",
}: {
  text: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View
      style={[
        s.row,
        {
          gap: 5,
          alignSelf: "flex-start",
          backgroundColor: theme.pale,
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
        },
      ]}
    >
      <Icon name={icon} size={12} color={theme.green} />
      <Text style={{ fontSize: 10, fontWeight: "600", color: theme.green }}>
        {text}
      </Text>
    </View>
  );
}
/** A small rounded label, e.g. "Draft" or "3 memories". */
export function Chip({
  text,
  icon,
  tone = "accent",
}: {
  text: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  tone?: "accent" | "neutral";
}) {
  const color = tone === "accent" ? theme.accentText : theme.sub;
  return (
    <View
      style={[
        s.row,
        {
          gap: 4,
          alignSelf: "flex-start",
          backgroundColor: tone === "accent" ? theme.pale : theme.muted,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
        },
      ]}
    >
      {icon ? <Icon name={icon} size={11} color={color} /> : null}
      <Text
        maxFontSizeMultiplier={1.6}
        style={{ fontSize: 11, lineHeight: 16, fontWeight: "600", color }}
      >
        {text}
      </Text>
    </View>
  );
}
/** A soft tinted circle holding an icon — the card "lead" for lists. */
export function IconBubble({
  name,
  size = 44,
  color = theme.accentText,
  background = theme.pale,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
  background?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={Math.round(size * 0.45)} color={color} />
    </View>
  );
}
export function AgentAvatar({
  agent,
  large,
  size,
  textStyle,
}: {
  agent: Pick<Agent, "name" | "color">;
  large?: boolean;
  size?: number;
  textStyle?: TextStyle;
}) {
  const dimension = size || (large ? 64 : 44);
  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        ...meshAvatar(agent.color, agent.name),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: theme.card,
        boxShadow: `0px 0px 0px 1px ${agent.color}33`,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          maxWidth: "100%",
          fontWeight: "600",
          fontFamily: fonts.heading,
          fontSize: size === 48 ? 22 : large ? 28 : 18,
          textShadowColor: "rgba(0,0,0,0.22)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
          ...textStyle,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {agent.name.slice(0, 1).toUpperCase() || "A"}
      </Text>
    </View>
  );
}
/**
 * An agent avatar that is alive: it breathes inside a halo of its own colour
 * and springs (with a soft burst) whenever its colour changes.
 */
export function LivingAvatar({
  agent,
  size = 64,
}: {
  agent: Pick<Agent, "name" | "color">;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(1)).current;
  const [bursts, setBursts] = useState(0);
  const firstColor = useRef(agent.color);
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);
  useEffect(() => {
    if (agent.color === firstColor.current) return;
    firstColor.current = agent.color;
    setBursts((n) => n + 1);
    if (reduced) return;
    morph.setValue(0.82);
    Animated.spring(morph, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 12,
    }).start();
  }, [agent.color, reduced]);
  const halo = size * 1.7;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          backgroundImage: `radial-gradient(circle at center, ${rgba(agent.color, 0.42)} 0%, ${rgba(agent.color, 0)} 68%)`,
          opacity: breathe.interpolate({
            inputRange: [0, 1],
            outputRange: [0.55, 1],
          }),
          transform: [
            {
              scale: breathe.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1.08],
              }),
            },
          ],
        }}
      />
      <Burst count={bursts} color={agent.color} size={size} spread={1.45} />
      <Animated.View style={{ transform: [{ scale: morph }] }}>
        <AgentAvatar
          agent={agent}
          size={size}
          textStyle={{ fontSize: Math.round(size * 0.42), fontWeight: "700" }}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Agent colour picker. Each swatch is a live miniature of the avatar it will
 * produce (same mesh, same name), so choosing feels like choosing a face.
 */
export function AuraPicker({
  value,
  onChange,
  name,
  options,
}: {
  value: string;
  onChange: (hex: string) => void;
  name: string;
  options: readonly { hex: string; name: string }[];
}) {
  const choices = options.some((o) => o.hex === value)
    ? options
    : [{ hex: value, name: "Current" }, ...options];
  const selectedName = choices.find((o) => o.hex === value)?.name || "Current";
  return (
    <View style={{ gap: 6 }}>
      <View style={[s.row, { gap: 6 }]}>
        <Text style={s.eyebrow}>Aura</Text>
        <Text
          style={{ fontSize: 12, fontWeight: "600", color: theme.accentText }}
        >
          {selectedName}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 6,
        }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Agent aura colour"
      >
        {choices.map((option) => (
          <AuraSwatch
            key={option.hex}
            hex={option.hex}
            label={option.name}
            seed={name}
            selected={option.hex === value}
            onPress={() => {
              if (option.hex !== value) haptic.aura();
              onChange(option.hex);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
function AuraSwatch({
  hex,
  label,
  seed,
  selected,
  onPress,
}: {
  hex: string;
  label: string;
  seed: string;
  selected: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const on = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) on.setValue(selected ? 1 : 0);
    else
      Animated.spring(on, {
        toValue: selected ? 1 : 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 10,
      }).start();
  }, [selected, reduced]);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${label} aura`}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      style={{
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* gradient ring that springs in around the chosen swatch */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundImage: `linear-gradient(135deg, ${hex} 0%, ${theme.accent2} 100%)`,
          opacity: on,
          transform: [
            {
              scale: on.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
          ],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 45,
          height: 45,
          borderRadius: 23,
          backgroundColor: theme.bg,
        }}
      />
      <Animated.View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          ...meshAvatar(hex, seed),
          transform: [
            {
              scale: on.interpolate({
                inputRange: [0, 1],
                outputRange: [0.86, 1],
              }),
            },
          ],
        }}
      />
    </Pressable>
  );
}
export function relativeDay(timestamp: number) {
  const then = new Date(timestamp);
  const now = new Date();
  const day = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(then)) / 86400000);
  if (diff === 0)
    return then.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  if (diff === 1) return "Yesterday";
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export function ConversationRow({
  conversation,
  onPress,
  onLongPress,
  accessibilityActions,
  onAccessibilityAction,
  accessibilityHint,
  agent,
  live,
}: {
  agent?: Agent;
  conversation: Conversation;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityActions?: React.ComponentProps<
    typeof Tappable
  >["accessibilityActions"];
  onAccessibilityAction?: React.ComponentProps<
    typeof Tappable
  >["onAccessibilityAction"];
  accessibilityHint?: string;
  /** This chat is replying right now. */
  live?: boolean;
}) {
  const tone = agent?.color || theme.primary;
  const last = conversation.messages.filter((m) => m.text).at(-1);
  const draftFiles = conversation.draftAttachments?.length || 0;
  const isDraft = !!draftFiles || !!conversation.draft?.length;
  const body = draftFiles
    ? `${draftFiles} attachment${draftFiles === 1 ? "" : "s"}${conversation.draft ? ` · ${conversation.draft}` : ""}`
    : conversation.draft?.length
      ? plainTextPreview(conversation.draft)
      : plainTextPreview(last?.text || "New conversation");
  const preview = isDraft ? `Draft: ${body}` : body;
  const date = relativeDay(conversation.updatedAt);
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={[
        `Open ${conversation.title}`,
        agent?.name,
        preview.slice(0, 140),
        live ? "Replying" : date,
      ]
        .filter(Boolean)
        .join(". ")}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityHint={accessibilityHint}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      feel="card"
      scaleTo={0.98}
      ripple={rgba(tone, 0.5)}
      style={[
        s.row,
        {
          gap: 14,
          padding: 16,
          marginBottom: 12,
          alignItems: "flex-start",
          borderWidth: 1,
          borderColor: live ? rgba(theme.primary, 0.35) : theme.hairline,
          borderRadius: 22,
          backgroundColor: theme.card,
          // A faint glow of the agent's colour rising from the top-left corner.
          backgroundImage: `radial-gradient(circle at 0% 0%, ${rgba(tone, 0.12)} 0%, ${rgba(tone, 0)} 55%)`,
          boxShadow: live
            ? `0px 6px 20px -6px ${rgba(theme.accent2, 0.35)}`
            : theme.cardShadow,
        },
      ]}
    >
      {agent ? (
        <AgentAvatar agent={agent} size={42} textStyle={{ fontSize: 17 }} />
      ) : (
        <IconBubble name="chatbubble-ellipses-outline" size={42} />
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={[s.row, { gap: 10, alignItems: "baseline" }]}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: "600",
              color: theme.ink,
              letterSpacing: -0.3,
            }}
          >
            {conversation.title}
          </Text>
          {live ? (
            <View style={[s.row, { gap: 2, marginVertical: -8 }]}>
              <ThinkingOrb size={12} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.accentText,
                }}
              >
                Replying…
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: theme.quiet }}>{date}</Text>
          )}
        </View>
        {agent || isDraft ? (
          <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
            {agent ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.accentText,
                }}
              >
                {agent.name}
              </Text>
            ) : null}
            {isDraft ? <Chip text="Draft" icon="create-outline" /> : null}
          </View>
        ) : null}
        <Text numberOfLines={2} style={[s.sub, { lineHeight: 20 }]}>
          {body}
        </Text>
      </View>
    </Tappable>
  );
}

/** Appearance-style picker with a sliding selection pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: {
    value: T;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const position = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    if (reduced) position.setValue(index);
    else
      Animated.spring(position, {
        toValue: index,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }).start();
  }, [index, reduced]);
  const segment = width ? (width - 8) / options.length : 0;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        backgroundColor: theme.muted,
        borderRadius: 18,
        padding: 4,
      }}
    >
      {segment ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 4,
            width: segment,
            borderRadius: 14,
            backgroundColor: theme.card,
            boxShadow: theme.cardShadow,
            transform: [{ translateX: Animated.multiply(position, segment) }],
          }}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              if (!selected) haptic.select();
              onChange(option.value);
            }}
            style={{
              flex: 1,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: 6,
            }}
          >
            <Icon
              name={option.icon}
              size={16}
              color={selected ? theme.accentText : theme.quiet}
            />
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: selected ? theme.ink : theme.quiet,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
}) {
  return (
    <View style={{ alignItems: "flex-start", paddingVertical: 28, gap: 8 }}>
      <Text style={[s.h2, { fontSize: 20 }]}>{title}</Text>
      <Text style={[s.sub, { maxWidth: 350 }]}>{body}</Text>
    </View>
  );
}
export async function confirm(
  title: string,
  message: string,
  action = "Delete",
  destructive = true,
): Promise<boolean> {
  if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: action,
          style: destructive ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}
export function FormScroll({
  children,
  contentStyle,
}: {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      // Full-bleed scroller with the 20 pt gutter inside it: card shadows and
      // edge-to-edge rows (e.g. the aura picker) are never clipped.
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={[
        { gap: 20, paddingBottom: 44, paddingHorizontal: 20 },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
