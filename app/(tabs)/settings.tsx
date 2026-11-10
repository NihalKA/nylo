import { Text } from "../../src/typography";
import { fonts } from "../../src/typography";
import Constants from "expo-constants";
import React, { useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { router } from "expo-router";
import { emptyData } from "../../src/types";
import { useStore } from "../../src/store";
import { exportBackup, pickBackup } from "../../src/backup";
import { FormScroll, Icon, Page, confirm, s, theme } from "../../src/ui";
import { DesignIconName } from "../../src/design-icons";

function SettingsRow({
  title,
  detail,
  icon,
  design,
  onPress,
  disabled,
  destructive,
  last,
}: {
  title: string;
  detail?: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  design: DesignIconName;
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
          borderBottomColor: "#F0F0EE",
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
          design={design}
          size={19}
          color={destructive ? theme.error : theme.ink}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            s.text,
            {
              fontFamily: detail ? fonts.heading : fonts.body,
              fontSize: detail ? 18 : 16,
              fontWeight: detail ? "600" : "500",
              letterSpacing: detail ? -0.45 : -0.4,
              lineHeight: 24,
              color: destructive ? theme.error : theme.ink,
            },
          ]}
        >
          {title}
        </Text>
        {detail ? (
          <Text style={[s.sub, { color: theme.quiet, lineHeight: 20 }]}>
            {detail}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" design="chevron" size={20} color="#C6C5D0" />
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
        boxShadow: "0px 2px 8px rgba(30,43,88,0.04)",
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
      <FormScroll contentStyle={{ gap: 24, paddingTop: 8 }}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={[
            s.title,
            {
              fontFamily: fonts.nimbus,
              fontSize: 16,
              lineHeight: 24,
              letterSpacing: -0.4,
              paddingTop: 0,
              paddingBottom: 0,
            },
          ]}
        >
          Settings
        </Text>
        <View style={{ gap: 4 }}>
          <Text
            style={[
              s.eyebrow,
              {
                fontFamily: fonts.nimbus,
                fontWeight: "700",
                fontSize: 12,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: "rgba(69,70,79,0.9)",
                paddingLeft: 4,
              },
            ]}
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
              design="key"
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
                paddingTop: 4,
                color: "rgba(69,70,79,0.8)",
              },
            ]}
          >
            Messages go to the provider you choose. Its API charges and data
            policies apply.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text
            style={[
              s.eyebrow,
              {
                fontFamily: fonts.nimbus,
                fontWeight: "700",
                fontSize: 12,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: "rgba(69,70,79,0.9)",
                paddingLeft: 4,
              },
            ]}
          >
            Data on this device
          </Text>
          <Group>
            <SettingsRow
              title="Export backup"
              icon="arrow-up-outline"
              design="export"
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
              design="restore"
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
                lineHeight: 21.13,
                fontFamily: fonts.nimbus,
                paddingHorizontal: 4,
                paddingTop: 4,
                color: "rgba(69,70,79,0.8)",
              },
            ]}
          >
            No automatic cloud sync. Export before uninstalling or changing
            devices.
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text
            style={[
              s.eyebrow,
              {
                fontFamily: fonts.nimbus,
                fontWeight: "700",
                fontSize: 12,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: "rgba(69,70,79,0.9)",
                paddingLeft: 4,
              },
            ]}
          >
            Help & privacy
          </Text>
          <Group>
            <SettingsRow
              title="Privacy policy"
              icon="shield-checkmark-outline"
              design="privacy"
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
              design="mail"
              onPress={() =>
                void action(() =>
                  Linking.openURL("mailto:admin@colorforfun.app"),
                )
              }
              last
            />
          </Group>
        </View>
        <View style={{ gap: 4 }}>
          <Text
            style={[
              s.eyebrow,
              {
                fontFamily: fonts.nimbus,
                fontWeight: "700",
                fontSize: 12,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: "rgba(69,70,79,0.9)",
                paddingLeft: 4,
              },
            ]}
          >
            Advanced
          </Text>
          <Group>
            <SettingsRow
              title="Live device check"
              icon="pulse-outline"
              design="deviceCheck"
              detail="Check replies, memory and persistence"
              onPress={() => router.push("/device-check")}
            />
            <SettingsRow
              title="Delete all local data"
              icon="trash-outline"
              design="deleteData"
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
        {process.env.EXPO_PUBLIC_UI_BUILD_MARKER ? (
          <Text testID="ui-build-marker" style={[s.sub, { fontSize: 12 }]}>
            {process.env.EXPO_PUBLIC_UI_BUILD_MARKER}
          </Text>
        ) : null}
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
