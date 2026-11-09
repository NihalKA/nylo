import { Text, TextInput, fonts } from "./typography";
import React, { useEffect, useState } from "react";
import {
  ColorValue,
  Image,
  Keyboard,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { Agent, Conversation } from "./types";
import { plainTextPreview } from "./domain";

// Warm Edition: Figma WNCRguvh0wqYTgBUlbXZ9G, inspected 10 Nov 2026.
// Shared by iOS and Android. Status colours stay distinct from the navy accent.
export const theme = {
  bg: "#F9F9F8",
  card: "#FFFFFF",
  surface: "#F3F4F3",
  ink: "#061542",
  primary: "#1E2B58",
  text: "#1A1C1C",
  sub: "#45464F",
  quiet: "#767680",
  line: "#E8E8E7",
  green: "#087B65",
  pale: "#EEF0F7",
  error: "#B42907",
  errorSurface: "#FFECE7",
  selected: "#DCE1FF",
  muted: "#EEEEED",
  file: "#F4F3EF",
  fileLine: "#E7E5E0",
  onPrimary: "#FFFFFF",
  overlay: "#06154266",
  attachmentOverlay: "#06154233",
};
export const softShadow = {
  shadowColor: theme.ink,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 1,
};
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  row: { flexDirection: "row", alignItems: "center" },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: "700",
    color: theme.ink,
    letterSpacing: -0.7,
  },
  h2: {
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: "700",
    color: theme.ink,
    letterSpacing: -0.4,
  },
  text: { fontSize: 16, lineHeight: 24, color: theme.ink },
  sub: { fontSize: 14, lineHeight: 21, color: theme.sub },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: theme.sub,
    textTransform: "uppercase",
  },
  card: {
    ...softShadow,
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
  },
  gap: { gap: 16 },
  section: { marginTop: 28, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: theme.surface,
    fontSize: 16,
    color: theme.ink,
    minHeight: 48,
  },
  error: { color: theme.error, fontSize: 13, lineHeight: 20 },
});
export function Icon({
  name,
  size = 20,
  color = theme.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Ionicons
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      name={name}
      size={size}
      color={typeof color === "number" ? theme.ink : (color ?? undefined)}
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
export function Page({ children }: { children: React.ReactNode }) {
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
}: {
  title: string;
  right?: React.ReactNode;
  titleStyle?: import("react-native").TextStyle;
  dismissKeyboard?: boolean;
  onDismissKeyboard?: () => void;
}) {
  return (
    <View style={[s.between, { minHeight: 56, gap: 8 }]}>
      <View style={[s.row, { flex: 1, gap: 10 }]}>
        <IconButton
          name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
          label="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          maxFontSizeMultiplier={1.6}
          style={[s.h2, { flex: 1 }, titleStyle]}
        >
          {title}
        </Text>
      </View>
      <View style={s.row}>
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
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
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
            ? trackColor?.true || "#059669"
            : trackColor?.false || "#C6C5D0",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: value ? 22 : 2,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
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
              backgroundColor: "#2563EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="checkmark" size={18} color="#FFFFFF" />
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
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color?: ColorValue;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        opacity: disabled ? 0.35 : pressed ? 0.55 : 1,
        backgroundColor: pressed ? theme.pale : "transparent",
      })}
    >
      <Icon
        name={name}
        size={size}
        color={typeof color === "number" ? theme.ink : (color ?? undefined)}
      />
    </Pressable>
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
      }}
    >
      {destinations.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            testID={`detail-tab-${item.key}`}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => router.navigate(item.path)}
            style={{
              flex: 1,
              minHeight: 49,
              paddingVertical: 4,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <View
              style={{
                width: 50,
                height: 24,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: selected ? theme.selected : "transparent",
              }}
            >
              <Icon
                name={selected ? item.selectedIcon : item.icon}
                size={23}
                color={selected ? theme.ink : theme.quiet}
              />
            </View>
            <Text
              maxFontSizeMultiplier={1.6}
              style={{
                fontSize: 11,
                fontWeight: "600",
                letterSpacing: 0.33,
                color: selected ? theme.ink : theme.quiet,
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
  textStyle?: import("react-native").TextStyle;
  iconPosition?: "start" | "end";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          ...(secondary || destructive ? {} : softShadow),
          minHeight: 48,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 24,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary
            ? destructive
              ? theme.errorSurface
              : theme.surface
            : destructive
              ? theme.error
              : theme.primary,
          borderWidth: secondary ? 1 : 0,
          borderColor: destructive ? "#FFB4A399" : theme.line,
          ...(disabled ? { backgroundColor: theme.muted } : {}),
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={secondary ? (destructive ? theme.error : theme.ink) : "#FFF"}
        />
      ) : icon && iconPosition === "start" ? (
        <Icon
          name={icon}
          color={secondary ? (destructive ? theme.error : theme.ink) : "#FFF"}
          size={17}
        />
      ) : null}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          letterSpacing: 0.14,
          color: disabled
            ? theme.quiet
            : secondary
              ? destructive
                ? theme.error
                : theme.ink
              : "#FFF",
          ...textStyle,
        }}
      >
        {title}
      </Text>
      {!loading && icon && iconPosition === "end" ? (
        <Icon
          name={icon}
          color={
            secondary
              ? destructive
                ? theme.error
                : theme.ink
              : theme.onPrimary
          }
          size={17}
        />
      ) : null}
    </Pressable>
  );
}
export function Field({
  label,
  help,
  labelStyle,
  ...props
}: TextInputProps & {
  label: string;
  help?: string;
  labelStyle?: import("react-native").TextStyle;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text
        style={[
          { fontSize: 14, fontWeight: "600", color: theme.ink },
          labelStyle,
        ]}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.sub}
        {...props}
        style={[
          s.input,
          props.multiline ? { minHeight: 100, textAlignVertical: "top" } : null,
          props.style,
        ]}
      />
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
          borderRadius: 7,
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
export function AgentAvatar({
  agent,
  large,
  size,
}: {
  agent: Pick<Agent, "name" | "color">;
  large?: boolean;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size || (large ? 64 : 44),
        height: size || (large ? 64 : 44),
        borderRadius: (size || (large ? 64 : 44)) / 2,
        backgroundColor: agent.color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          maxWidth: "100%",
          fontWeight: "600",
          fontFamily: fonts.heading,
          fontSize: size === 48 ? 22 : large ? 28 : 18,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {agent.name.slice(0, 1).toUpperCase() || "A"}
      </Text>
    </View>
  );
}
export function ConversationRow({
  conversation,
  onPress,
  agent,
}: {
  agent?: Agent;
  conversation: Conversation;
  onPress: () => void;
}) {
  const last = conversation.messages.filter((m) => m.text).at(-1);
  const preview = conversation.draftAttachments?.length
    ? `Draft: ${conversation.draftAttachments.length} attachment${conversation.draftAttachments.length === 1 ? "" : "s"}${conversation.draft ? ` · ${conversation.draft}` : ""}`
    : conversation.draft?.length
      ? `Draft: ${plainTextPreview(conversation.draft)}`
      : plainTextPreview(last?.text || "New conversation");
  const date = new Date(conversation.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        `Open ${conversation.title}`,
        agent?.name,
        preview.slice(0, 140),
        date,
      ]
        .filter(Boolean)
        .join(". ")}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        {
          gap: 12,
          ...softShadow,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.line,
          borderRadius: 20,
          backgroundColor: pressed ? theme.pale : theme.card,
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <View style={[s.row, { gap: 12, alignItems: "baseline" }]}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "600",
              color: theme.ink,
              letterSpacing: -0.3,
            }}
          >
            {conversation.title}
          </Text>
          <Text style={{ fontSize: 12, color: theme.sub }}>{date}</Text>
        </View>
        {agent ? (
          <View style={[s.row, { gap: 6 }]}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: agent.color,
              }}
            />
            <Text style={{ fontSize: 12, color: theme.sub }}>{agent.name}</Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={s.sub}>
          {preview}
        </Text>
      </View>
    </Pressable>
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
export function FormScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 20, paddingBottom: 44 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
