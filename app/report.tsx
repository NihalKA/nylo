import { Text } from "../src/typography";
import { fonts } from "../src/typography";
import React, { useState } from "react";
import { Linking, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../src/store";
import {
  Button,
  Switch,
  Field,
  FormScroll,
  Header,
  Icon,
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
      <Header title="Report a response" titleStyle={{ letterSpacing: -0.45 }} />
      <FormScroll>
        <Text style={[s.h2, { letterSpacing: -0.18 }]}>
          Tell us what went wrong
        </Text>
        <Text style={s.sub}>
          Reports go to{" "}
          <Text style={{ color: theme.ink, fontWeight: "500" }}>
            admin@colorforfun.app
          </Text>{" "}
          using your email app. Nylo sends nothing automatically. No API key,
          other messages or attachments are included.
        </Text>
        <Field
          label="What should we review?"
          labelStyle={{ ...s.h2, letterSpacing: -0.18 }}
          value={details}
          onChangeText={setDetails}
          maxLength={1500}
          multiline
          style={{
            minHeight: 140,
            fontSize: 14,
            lineHeight: 20,
            borderColor: "rgba(198, 197, 208, 0.4)",
          }}
          placeholderTextColor={theme.quiet}
          placeholder="Unsafe content, a privacy concern, or another issue…"
        />
        <Text
          style={{
            color: theme.quiet,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.33,
            alignSelf: "flex-end",
            marginTop: -14,
          }}
        >
          Optional details
        </Text>
        <View
          style={[
            s.card,
            s.between,
            {
              gap: 12,
              flexWrap: "wrap",
              borderColor: "rgba(198, 197, 208, 0.3)",
            },
          ]}
        >
          <View style={{ flex: 1, minWidth: 160, gap: 6 }}>
            <Text
              style={[
                s.text,
                { color: theme.text, fontWeight: "500", letterSpacing: -0.08 },
              ]}
            >
              Include this response excerpt
            </Text>
            <Text style={[s.sub, { fontSize: 12, lineHeight: 18 }]}>
              Embeds the snippet directly into the generated draft for
              investigation.
            </Text>
          </View>
          <Switch
            trackColor={{ false: theme.muted, true: theme.primary }}
            accessibilityLabel="Include selected response text"
            value={include}
            onValueChange={setInclude}
            disabled={!message}
          />
        </View>
        <View style={[s.between, { flexWrap: "wrap", gap: 8 }]}>
          <Text
            accessibilityRole="header"
            style={[s.h2, { letterSpacing: -0.18 }]}
          >
            Report preview
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: "#8793C7",
              letterSpacing: 0.33,
              backgroundColor: theme.line,
              borderRadius: 9,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            Automated Draft
          </Text>
        </View>
        <View
          style={[
            s.card,
            {
              // Figma alpha composited over the page. An opaque surface keeps
              // native elevation shadows from bleeding through the card fill.
              backgroundColor: "#F5F6F5",
              borderColor: "rgba(198, 197, 208, 0.4)",
              gap: 12,
            },
          ]}
        >
          <View style={s.between}>
            <Text
              style={{
                color: theme.ink,
                fontSize: 14,
                fontWeight: "600",
                letterSpacing: 0.14,
              }}
            >
              Nylo response report
            </Text>
            <Icon
              name="shield-checkmark-outline"
              size={16}
              color={theme.quiet}
            />
          </View>
          <Text
            selectable
            style={{
              fontFamily: fonts.mono,
              fontSize: 12,
              lineHeight: 18,
              color: theme.sub,
            }}
          >
            Model: {message?.model || "Not recorded"}
          </Text>
          <Text
            selectable
            style={{
              fontFamily: fonts.mono,
              fontSize: 13,
              lineHeight: 20,
              color: theme.text,
            }}
          >
            {details.trim() || "Please investigate this response."}
          </Text>
          {include && message ? (
            <View
              style={{
                backgroundColor: theme.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#C6C5D033",
                padding: 12,
              }}
            >
              <Text
                selectable
                style={[
                  s.sub,
                  { fontSize: 12, lineHeight: 18, color: theme.quiet },
                ]}
              >
                {`Selected response excerpt (up to 2000 characters):\n${message.text.slice(0, 2000)}`}
              </Text>
            </View>
          ) : null}
        </View>
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
        <Text style={[s.sub, { fontSize: 12, lineHeight: 18 }]}>
          Review and send in your email app. Opening the draft does not deliver
          a report. For urgent personal safety concerns, contact local emergency
          services.
        </Text>
        {message ? (
          <Button
            title="Remove this response from my device"
            secondary
            destructive
            icon="trash-outline"
            style={{
              minHeight: 54,
              borderRadius: 27,
              backgroundColor: runningId ? theme.muted : "#FCEAE5",
            }}
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
