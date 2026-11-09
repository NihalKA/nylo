import React, { useState } from "react";
import { Linking, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../src/store";
import {
  Button,
  Field,
  FormScroll,
  Header,
  Page,
  confirm,
  s,
  theme,
} from "../src/ui";
export default function Report() {
  const { chatId, messageId } = useLocalSearchParams<{
    chatId: string;
    messageId: string;
  }>();
  const { data, update, runningId } = useStore();
  const message = data.conversations
    .find((c) => c.id === chatId)
    ?.messages.find((m) => m.id === messageId && m.role === "assistant");
  const [details, setDetails] = useState("");
  const [include, setInclude] = useState(false);
  const [error, setError] = useState("");
  const preview = `Nylo response report\nModel: ${message?.model || "Not recorded"}\n\n${details.trim() || "Please investigate this response."}${include && message ? `\n\nSelected response excerpt (up to 2000 characters):\n${message.text.slice(0, 2000)}` : ""}`;
  return (
    <Page>
      <Header title="Report a response" />
      <FormScroll>
        <Text style={s.h2}>Tell us what went wrong</Text>
        <Text style={s.sub}>
          Reports go to admin@colorforfun.app using your email app. Nylo sends
          nothing automatically. No API key, other messages or attachments are
          included.
        </Text>
        <Field
          label="What should we review?"
          value={details}
          onChangeText={setDetails}
          maxLength={1500}
          multiline
          placeholder="Unsafe content, a privacy concern, or another issue…"
        />
        <View style={[s.card, s.between, { gap: 12, flexWrap: "wrap" }]}>
          <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
            <Text style={s.text}>Include this response excerpt</Text>
            <Text style={s.sub}>
              Only this selected answer is added to the report.
            </Text>
          </View>
          <Switch
            trackColor={{ false: theme.muted, true: theme.ink }}
            accessibilityLabel="Include selected response text"
            value={include}
            onValueChange={setInclude}
            disabled={!message}
          />
        </View>
        <Text accessibilityRole="header" style={s.h2}>
          Report preview
        </Text>
        <Text selectable style={[s.sub, s.card]}>
          {preview}
        </Text>
        <Button
          title="Open email to send report"
          icon="mail-outline"
          onPress={() =>
            void (async () => {
              try {
                await Linking.openURL(
                  `mailto:admin@colorforfun.app?subject=${encodeURIComponent("Nylo response report")}&body=${encodeURIComponent(preview)}`,
                );
              } catch {
                setError(
                  "No email app is available. Copy your report details and contact admin@colorforfun.app.",
                );
              }
            })()
          }
        />
        <Text style={s.sub}>
          Review and send in your email app. Opening the draft does not deliver
          a report. For urgent personal safety concerns, contact local emergency
          services.
        </Text>
        {message ? (
          <Button
            title="Remove this response from my device"
            secondary
            destructive
            disabled={!!runningId}
            onPress={() =>
              void (async () => {
                try {
                  if (
                    !(await confirm(
                      "Remove this response?",
                      "This removes the selected answer from this conversation. It cannot erase provider-held copies or reports you sent.",
                      "Remove",
                    ))
                  )
                    return;
                  await update((d) => ({
                    ...d,
                    conversations: d.conversations.map((c) =>
                      c.id === chatId
                        ? {
                            ...c,
                            messages: c.messages.filter(
                              (m) => m.id !== messageId,
                            ),
                          }
                        : c,
                    ),
                  }));
                  router.back();
                } catch (e) {
                  setError((e as Error).message);
                }
              })()
            }
          />
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
      </FormScroll>
    </Page>
  );
}
