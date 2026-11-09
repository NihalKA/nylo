import { Text } from "../../src/typography";
import { fonts } from "../../src/typography";
import Constants from "expo-constants";
import React, { useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";
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
      accessibilityLabel={[title, detail].filter(Boolean).join(". ")}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        {
          minHeight: 58,
          gap: 16,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.line,
          opacity: disabled ? 0.4 : pressed ? 0.55 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: destructive ? "#FFDAD2" : theme.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={icon}
          size={19}
          color={destructive ? theme.error : theme.ink}
        />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={[
            s.text,
            {
              fontFamily: detail ? fonts.heading : fonts.body,
              fontSize: detail ? 18 : 16,
              fontWeight: detail ? "600" : "500",
              letterSpacing: detail ? -0.45 : -0.4,
              color: destructive ? theme.error : theme.ink,
            },
          ]}
        >
          {title}
        </Text>
        {detail ? (
          <Text style={[s.sub, { color: theme.quiet }]}>{detail}</Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={20} color="#C6C5D0" />
    </Pressable>
  );
}
function Group({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: "#E7E7E5",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

export default function Settings() {
  const { data, importBackup, runningId } = useStore();
  const [busy, setBusy] = useState(false);
  const actionLocked = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const disabled = busy || !!runningId;
  const action = async (fn: () => Promise<unknown>) => {
    if (actionLocked.current) return;
    actionLocked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      actionLocked.current = false;
      setBusy(false);
    }
  };
  return (
    <Page>
      <FormScroll>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[
            s.title,
            {
              fontFamily: fonts.nimbus,
              fontSize: 16,
              letterSpacing: -0.4,
              paddingTop: 12,
              paddingBottom: 8,
            },
          ]}
        >
          Settings
        </Text>
        <View style={{ gap: 9 }}>
          <Text
            style={[s.eyebrow, { fontFamily: fonts.nimbus, paddingLeft: 4 }]}
          >
            Your AI
          </Text>
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
          <Text
            style={[
              s.sub,
              {
                fontSize: 13,
                lineHeight: 21,
                fontFamily: fonts.nimbus,
                paddingHorizontal: 4,
              },
            ]}
          >
            Messages go to the provider you choose. Its API charges and data
            policies apply.
          </Text>
        </View>
        <View style={{ gap: 9 }}>
          <Text
            style={[s.eyebrow, { fontFamily: fonts.nimbus, paddingLeft: 4 }]}
          >
            Data on this device
          </Text>
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
                      "The backup contains readable chats, drafts, memories and attached photos/files. Anyone with the backup can read them. Keep it private. API keys are excluded.",
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
                      "Your chats, attached files, agents and connections will be replaced. Saved keys are removed; enter them again afterward. Recent-chat sharing is reset and can be enabled again in each agent.",
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
          <Text
            style={[
              s.sub,
              {
                fontSize: 13,
                lineHeight: 21,
                fontFamily: fonts.nimbus,
                paddingHorizontal: 4,
              },
            ]}
          >
            No automatic cloud sync. Export before uninstalling or changing
            devices.
          </Text>
        </View>
        <View style={{ gap: 9 }}>
          <Text
            style={[s.eyebrow, { fontFamily: fonts.nimbus, paddingLeft: 4 }]}
          >
            Help & privacy
          </Text>
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
          <Text
            style={[s.eyebrow, { fontFamily: fonts.nimbus, paddingLeft: 4 }]}
          >
            Advanced
          </Text>
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
                      "This removes Nylo’s chats, its copies of attached files, agents, memories and saved provider connections from this device. Original files and photos outside Nylo are not removed. Exported backups are not affected. This cannot be undone.",
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
        <Text style={[s.sub, { paddingVertical: 8, textAlign: "center" }]}>
          Nylo · {Constants.expoConfig?.version || "Development"}
          {Constants.nativeBuildVersion
            ? ` (${Constants.nativeBuildVersion})`
            : ""}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/licenses")}
          style={{
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[s.sub, { fontSize: 12 }]}>Font licenses</Text>
        </Pressable>
      </FormScroll>
    </Page>
  );
}
