import React from "react";
import {
  ColorValue,
  Image,
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

export const theme = {
  bg: "#FFFFFF",
  card: "#FFFFFF",
  ink: "#172421",
  sub: "#626C68",
  line: "#E8ECEA",
  green: "#087F68",
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
    fontSize: 34,
    fontWeight: "600",
    color: theme.ink,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 19,
    fontWeight: "600",
    color: theme.ink,
    letterSpacing: -0.4,
  },
  text: { fontSize: 16, lineHeight: 24, color: theme.ink },
  sub: { fontSize: 13, lineHeight: 20, color: theme.sub },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: theme.sub,
  },
  card: {
    padding: 20,
    borderRadius: 18,
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
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#FFF",
    fontSize: 15,
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
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={[s.between, { minHeight: 64, gap: 12 }]}>
      <View style={[s.row, { flex: 1, gap: 10 }]}>
        <IconButton
          name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
          label="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <Text numberOfLines={1} style={[s.h2, { flex: 1 }]}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
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
  onPress,
  secondary,
  destructive,
  disabled,
  icon,
  loading,
  style,
}: {
  title: string;
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
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 50,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 13,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: secondary
            ? theme.card
            : destructive
              ? theme.error
              : theme.green,
          borderWidth: secondary ? 1 : 0,
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
        borderRadius: large ? 21 : 15,
        backgroundColor: agent.color + "15",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: agent.color,
          fontWeight: "600",
          fontSize: large ? 28 : 20,
        }}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${conversation.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        s.between,
        {
          gap: 14,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: theme.line,
          opacity: pressed ? 0.5 : 1,
        },
      ]}
    >
      {agent ? (
        <AgentAvatar agent={agent} />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: theme.pale,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="chatbubble-outline" size={18} color={theme.green} />
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: "500", color: theme.ink }}
        >
          {conversation.title}
        </Text>
        <Text numberOfLines={1} style={s.sub}>
          {agent ? `${agent.name} · ` : ""}
          {last?.text || "New conversation"}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: theme.sub }}>
        {new Date(conversation.updatedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </Text>
      <Icon name="chevron-forward" size={14} color={theme.sub} />
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
    <View style={{ alignItems: "center", paddingVertical: 36, gap: 10 }}>
      <View
        style={{
          padding: 15,
          borderRadius: 20,
          backgroundColor: theme.pale,
          marginBottom: 6,
        }}
      >
        <Icon name={icon} color={theme.green} size={25} />
      </View>
      <Text style={s.h2}>{title}</Text>
      <Text style={[s.sub, { textAlign: "center", maxWidth: 310 }]}>
        {body}
      </Text>
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
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 20, paddingBottom: 44 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
