import Constants from "expo-constants";
import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { emptyData } from "../../src/types";
import { useStore } from "../../src/store";
import { exportBackup, pickBackup } from "../../src/backup";
import {
  FormScroll,
  Icon,
  NyloMark,
  Page,
  confirm,
  s,
  theme,
} from "../../src/ui";

function SettingsRow({
  title,
  detail,
  icon,
  onPress,
  disabled,
  destructive,
  last,
}: {
  title: string;
  detail?: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        {
          minHeight: 58,
          gap: 14,
          paddingVertical: 14,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.line,
          opacity: disabled ? 0.4 : pressed ? 0.55 : 1,
        },
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={destructive ? theme.error : theme.ink}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={[s.text, { color: destructive ? theme.error : theme.ink }]}
        >
          {title}
        </Text>
        {detail ? <Text style={s.sub}>{detail}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={13} color={theme.sub} />
    </Pressable>
  );
}
function Group({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 18,
        paddingHorizontal: 16,
      }}
    >
      {children}
    </View>
  );
}

export default function Settings() {
  const { data, importBackup, runningId } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const disabled = busy || !!runningId;
  const action = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <FormScroll>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[s.title, { paddingTop: 12, paddingBottom: 8 }]}
        >
          Settings
        </Text>
        <View style={[s.row, { gap: 12, paddingBottom: 4 }]}>
          <NyloMark size={40} />
          <View style={{ gap: 2 }}>
            <Text style={s.h2}>Nylo</Text>
            <Text style={s.sub}>
              Version {Constants.expoConfig?.version || "Development"}
              {Constants.nativeBuildVersion
                ? ` (${Constants.nativeBuildVersion})`
                : ""}
            </Text>
          </View>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={[s.sub, { paddingLeft: 4 }]}>Your AI</Text>
          <Group>
            <SettingsRow
              title={
                data.connections.length
                  ? "Manage AI providers"
                  : "Connect your AI"
              }
              detail={
                data.connections.length
                  ? `${data.connections.length} saved ${data.connections.length === 1 ? "connection" : "connections"}`
                  : "Use your own provider and API key"
              }
              icon="key-outline"
              onPress={() => router.push("/connection")}
              last
            />
          </Group>
          <Text style={[s.sub, { fontSize: 12, paddingHorizontal: 4 }]}>
            Messages go to the provider you choose. Its API charges and data
            policies apply.
          </Text>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={[s.sub, { paddingLeft: 4 }]}>Data on this device</Text>
          <Group>
            <SettingsRow
              title="Export backup"
              icon="arrow-up-outline"
              disabled={disabled}
              onPress={() =>
                void action(async () => {
                  if (
                    await confirm(
                      "Export private conversations?",
                      "The backup contains your chats and memories as readable text. Keep it somewhere private. API keys are excluded.",
                      "Export",
                      false,
                    )
                  )
                    await exportBackup(data);
                })
              }
            />
            <SettingsRow
              title="Restore backup"
              icon="arrow-down-outline"
              disabled={disabled}
              onPress={() =>
                void action(async () => {
                  const value = await pickBackup();
                  if (
                    value &&
                    (await confirm(
                      "Replace local data?",
                      "Your chats, agents, and connections will be replaced. Saved keys will be removed; enter them again afterward.",
                      "Restore",
                    ))
                  ) {
                    await importBackup(value);
                    setNotice(
                      "Backup restored. Add your API keys to continue.",
                    );
                  }
                })
              }
              last
            />
          </Group>
          <Text style={[s.sub, { fontSize: 12, paddingHorizontal: 4 }]}>
            No automatic cloud sync. Export before uninstalling or changing
            devices.
          </Text>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={[s.sub, { paddingLeft: 4 }]}>Help & privacy</Text>
          <Group>
            <SettingsRow
              title="Privacy policy"
              icon="shield-checkmark-outline"
              onPress={() =>
                void action(() =>
                  Linking.openURL(
                    "https://nihalka.github.io/nylo/privacy.html",
                  ),
                )
              }
            />
            <SettingsRow
              title="Contact support"
              icon="mail-outline"
              onPress={() =>
                void action(() =>
                  Linking.openURL("mailto:admin@colorforfun.app"),
                )
              }
              last
            />
          </Group>
        </View>
        <View style={{ gap: 9 }}>
          <Text style={[s.sub, { paddingLeft: 4 }]}>Advanced</Text>
          <Group>
            <SettingsRow
              title="Live device check"
              icon="pulse-outline"
              detail="Check replies, memory and persistence"
              onPress={() => router.push("/device-check")}
            />
            <SettingsRow
              title="Delete all local data"
              icon="trash-outline"
              destructive
              disabled={disabled}
              last
              onPress={() =>
                void action(async () => {
                  if (
                    await confirm(
                      "Delete all local data?",
                      "This removes Nylo’s chats, agents, memories and saved provider connections from this device. Exported backups are not affected. This cannot be undone.",
                      "Delete all",
                    )
                  ) {
                    await importBackup(emptyData());
                    setNotice(
                      "Chats, agents and provider connections removed.",
                    );
                  }
                })
              }
            />
          </Group>
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text
            accessibilityRole="alert"
            style={[s.sub, { color: theme.green }]}
          >
            {notice}
          </Text>
        ) : null}
      </FormScroll>
    </Page>
  );
}
