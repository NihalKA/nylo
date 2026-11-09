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
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useSegments } from "expo-router";
import { Agent, Conversation } from "./types";
import { plainTextPreview } from "./domain";

export const theme = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  surface: "#F4F4F5",
  ink: "#1C1C1F",
  sub: "#69696F",
  line: "#E8E8EB",
  green: "#087B65",
  pale: "#EAF5F0",
  error: "#9C3E38",
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
    fontSize: 32,
    fontWeight: "700",
    color: theme.ink,
    letterSpacing: -0.9,
  },
  h2: {
    fontSize: 19,
    fontWeight: "600",
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
  },
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  gap: { gap: 16 },
  section: { marginTop: 28, marginBottom: 14 },
  input: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: theme.surface,
    fontSize: 16,
    color: theme.ink,
    minHeight: 50,
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
  dismissKeyboard,
  onDismissKeyboard,
}: {
  title: string;
  right?: React.ReactNode;
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
          style={[s.h2, { flex: 1 }]}
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
export function IconButton({
  name,
  label,
  onPress,
  color,
  disabled,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  color?: ColorValue;
  disabled?: boolean;
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
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        opacity: disabled ? 0.35 : pressed ? 0.55 : 1,
        backgroundColor: pressed ? theme.pale : "transparent",
      })}
    >
      <Icon
        name={name}
        color={typeof color === "number" ? theme.ink : (color ?? undefined)}
      />
    </Pressable>
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
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 24,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary
            ? theme.surface
            : destructive
              ? theme.error
              : theme.ink,
          borderWidth: 0,
          borderColor: theme.line,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={secondary ? (destructive ? theme.error : theme.ink) : "#FFF"}
        />
      ) : icon ? (
        <Icon
          name={icon}
          color={secondary ? (destructive ? theme.error : theme.ink) : "#FFF"}
          size={17}
        />
      ) : null}
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: secondary ? (destructive ? theme.error : theme.ink) : "#FFF",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  help,
  ...props
}: TextInputProps & { label: string; help?: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: theme.ink }}>
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
      {help ? <Text style={s.sub}>{help}</Text> : null}
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
}: {
  agent: Pick<Agent, "name" | "color">;
  large?: boolean;
}) {
  return (
    <View
      style={{
        width: large ? 64 : 44,
        height: large ? 64 : 44,
        borderRadius: large ? 22 : 16,
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
          fontSize: large ? 28 : 20,
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
          paddingVertical: 17,
          borderBottomWidth: 1,
          borderBottomColor: theme.line,
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
