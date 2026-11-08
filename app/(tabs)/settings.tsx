import Constants from "expo-constants";
import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { emptyData } from "../../src/types";
import { useStore } from "../../src/store";
import { exportBackup, pickBackup } from "../../src/backup";
import {
  Button,
  FormScroll,
  Icon,
  NyloMark,
  Page,
  confirm,
  s,
  theme,
} from "../../src/ui";
export default function Settings() {
  const { data, importBackup, runningId } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const action = async (fn: () => Promise<unknown>) => {
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
          style={[s.title, { paddingTop: 16, paddingBottom: 24 }]}
        >
          Settings
        </Text>
        <View style={[s.row, { gap: 14, paddingBottom: 8 }]}>
          <NyloMark size={52} />
          <View style={{ flex: 1 }}>
            <Text style={[s.h2, { fontSize: 23 }]}>Nylo</Text>
            <Text style={s.sub}>Your conversations. Your choice of AI.</Text>
          </View>
        </View>
        <Text style={s.eyebrow}>AI PROVIDERS</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            data.connections.length ? "Manage AI providers" : "Connect your AI"
          }
          accessibilityHint="Add or edit a provider API key and model."
          onPress={() => router.push("/connection")}
          style={[
            s.row,
            {
              gap: 12,
              borderWidth: 1,
              borderColor: theme.line,
              borderRadius: 16,
              padding: 16,
              minHeight: 76,
            },
          ]}
        >
          <Icon name="key-outline" color={theme.green} />
          <View style={{ flex: 1 }}>
            <Text style={[s.text, { fontWeight: "600" }]}>
              {data.connections.length
                ? "Manage AI providers"
                : "Connect your AI"}
            </Text>
            <Text style={s.sub}>
              {data.connections.length
                ? `${data.connections.length} saved · API access is checked when you send`
                : "Add an API key from OpenAI, Claude, or another provider."}
            </Text>
          </View>
          <Icon name="chevron-forward" color={theme.sub} size={16} />
        </Pressable>
        <Text style={s.eyebrow}>ON THIS DEVICE</Text>
        <Button
          title="Live device check"
          secondary
          icon="pulse-outline"
          onPress={() => router.push("/device-check")}
        />
        <View style={[s.card, { gap: 18 }]}>
          <View style={[s.row, { gap: 12 }]}>
            <Icon name="phone-portrait-outline" color={theme.green} />
            <View style={{ flex: 1 }}>
              <Text style={[s.text, { fontWeight: "600" }]}>
                History & memory
              </Text>
              <Text style={s.sub}>
                Saved here, with no automatic cloud sync. Export before
                uninstalling or changing phones.
              </Text>
            </View>
          </View>
          <Button
            title="Export backup"
            secondary
            icon="download-outline"
            disabled={busy || !!runningId}
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
          <Button
            title="Restore backup"
            secondary
            icon="push-outline"
            disabled={busy || !!runningId}
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
                  setNotice("Backup restored. Add your API keys to continue.");
                }
              })
            }
          />
        </View>
        <Text style={s.eyebrow}>GOOD TO KNOW</Text>
        <View style={{ gap: 12 }}>
          <Text style={s.text}>
            AI replies come from your selected provider. Its API charges and
            data policies apply.
          </Text>
          <Text style={s.sub}>
            Chats and saved agent memories are sent when you message that
            provider. Responses stop when you leave the app; retry makes a new
            request.
          </Text>
        </View>
        <Button
          title="Privacy policy"
          secondary
          icon="shield-checkmark-outline"
          onPress={() =>
            void action(() =>
              Linking.openURL("https://nihalka.github.io/nylo/privacy.html"),
            )
          }
        />
        <Button
          title="Contact support"
          secondary
          icon="mail-outline"
          onPress={() =>
            void action(() => Linking.openURL("mailto:admin@colorforfun.app"))
          }
        />
        {error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text accessibilityRole="alert" style={{ color: theme.green }}>
            {notice}
          </Text>
        ) : null}
        <Button
          title="Delete all local data"
          secondary
          destructive
          disabled={busy || !!runningId}
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
                setNotice("Chats, agents and provider connections removed.");
              }
            })
          }
        />
        <Text style={[s.sub, { textAlign: "center", paddingVertical: 8 }]}>
          Nylo {Constants.expoConfig?.version || "Development"} · Your own space
        </Text>
      </FormScroll>
    </Page>
  );
}
