import { Text } from "../src/typography";
import { fonts } from "../src/typography";
import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { AppearancePreference } from "../src/theme";
import { hapticsEnabled, setHapticsEnabled } from "../src/haptics";
import { setSoundsEnabled, soundsEnabled } from "../src/sounds";
import { router } from "expo-router";
import { emptyData } from "../src/types";
import { useStore } from "../src/store";
import { exportBackup, pickBackup } from "../src/backup";
import {
  FormScroll,
  Icon,
  Header,
  Page,
  Segmented,
  Switch,
  Tappable,
  confirm,
  rgba,
  s,
  theme,
  useTheme,
  Press,
  BrandMark,
  BrandWordmark,
  BrandLine,
} from "../src/ui";
import { DesignIconName } from "../src/design-icons";

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
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={[title, detail].filter(Boolean).join(". ")}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      feel={destructive ? "warn" : "button"}
      scaleTo={0.985}
      ripple={rgba(destructive ? theme.error : theme.primary, 0.18)}
      style={[
        s.row,
        {
          minHeight: 58,
          gap: 16,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.hairline,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: destructive ? theme.errorSurface : theme.pale,
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
      <Icon name="chevron-forward" design="chevron" size={20} />
    </Tappable>
  );
}
function PreferenceRow({
  icon,
  title,
  detail,
  value,
  onChange,
  last,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={[
        s.row,
        {
          minHeight: 58,
          gap: 16,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 8,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.hairline,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.pale,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={19} color={theme.accentText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            s.text,
            { fontWeight: "500", letterSpacing: -0.4, lineHeight: 24 },
          ]}
        >
          {title}
        </Text>
        <Text style={[s.sub, { color: theme.quiet, lineHeight: 20 }]}>
          {detail}
        </Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.primary }}
      />
    </View>
  );
}
function Group({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.hairline,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: theme.cardShadow,
      }}
    >
      {children}
    </View>
  );
}

const appearanceOptions: {
  value: AppearancePreference;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
}[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export default function Settings() {
  const { preference, setPreference } = useTheme();
  const [sounds, setSounds] = useState(true);
  const [vibration, setVibration] = useState(true);
  useEffect(() => {
    void soundsEnabled().then(setSounds);
    void hapticsEnabled().then(setVibration);
  }, []);
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
    <Page aura>
      <Header title="Settings" titleStyle={{ fontSize: 20 }} />
      <FormScroll contentStyle={{ gap: 24, paddingTop: 8 }}>
        <View style={{ gap: 8 }}>
          <Text
            style={[
              s.eyebrow,
              {
                fontFamily: fonts.nimbus,
                fontWeight: "700",
                fontSize: 12,
                lineHeight: 18,
                letterSpacing: 0.6,
                color: theme.sub,
                paddingLeft: 4,
              },
            ]}
          >
            Appearance
          </Text>
          <Segmented
            label="Appearance"
            options={appearanceOptions}
            value={preference}
            onChange={setPreference}
          />
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
                color: theme.sub,
                paddingLeft: 4,
              },
            ]}
          >
            Sound & touch
          </Text>
          <Group>
            <PreferenceRow
              icon="musical-notes-outline"
              title="Sounds"
              detail="Soft tones for taps, sending and replies"
              value={sounds}
              onChange={(value) => {
                setSoundsEnabled(value);
                setSounds(value);
              }}
            />
            <PreferenceRow
              icon="pulse-outline"
              title="Vibration"
              detail="A distinct feel for each kind of action"
              value={vibration}
              onChange={(value) => {
                setHapticsEnabled(value);
                setVibration(value);
              }}
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
                color: theme.quiet,
              },
            ]}
          >
            Sounds follow your iPhone’s silent switch and play alongside your
            music.
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
                color: theme.sub,
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
                color: theme.quiet,
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
                color: theme.sub,
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
                color: theme.quiet,
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
                color: theme.sub,
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
                color: theme.sub,
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
        <View style={{ alignItems: "center", gap: 10, paddingTop: 12 }}>
          <BrandLine style={{ width: 56 }} />
          <View style={[s.row, { gap: 8 }]}>
            <BrandMark height={20} />
            <BrandWordmark height={18} />
          </View>
        </View>
        <Text style={[s.sub, { paddingBottom: 8, textAlign: "center" }]}>
          Version {Constants.expoConfig?.version || "Development"}
          {Constants.nativeBuildVersion
            ? ` (${Constants.nativeBuildVersion})`
            : ""}
        </Text>
        {process.env.EXPO_PUBLIC_UI_BUILD_MARKER ? (
          <Text testID="ui-build-marker" style={[s.sub, { fontSize: 12 }]}>
            {process.env.EXPO_PUBLIC_UI_BUILD_MARKER}
          </Text>
        ) : null}
        <Press
          feel="tick"
          accessibilityRole="button"
          onPress={() => router.push("/licenses")}
          style={{
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[s.sub, { fontSize: 12 }]}>Font licenses</Text>
        </Press>
      </FormScroll>
    </Page>
  );
}
