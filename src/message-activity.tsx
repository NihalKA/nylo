import React, { useState } from "react";
import { Alert, Linking, Modal, ScrollView, View } from "react-native";
import { Text } from "./typography";
import { IconButton, Icon, Page, Press, s, theme } from "./ui";
import { safeWebUrl, Source } from "./message-format";

export function MessageActivity({
  actions = [],
  active = false,
  progress,
}: {
  actions?: string[];
  active?: boolean;
  progress?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!actions.length) return null;
  const failed = actions.some((label) =>
    label.toLowerCase().includes("failed"),
  );
  const color = failed ? theme.error : active ? theme.sub : theme.green;
  const label = active
    ? actions.at(-1)!
    : actions.length === 1
      ? actions[0]
      : `Activity · ${actions.length}`;
  return (
    <View style={{ gap: 6 }}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minHeight: 36,
        }}
      >
        <Icon
          name={
            failed
              ? "alert-circle-outline"
              : active
                ? "time-outline"
                : "checkmark-circle-outline"
          }
          size={14}
          color={color}
        />
        <Text
          style={{
            color,
            fontSize: 12,
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={theme.sub}
        />
      </Press>
      {expanded ? (
        <View style={{ gap: 6, paddingLeft: 20 }}>
          {actions.map((label, i) => (
            <Text key={i} style={{ fontSize: 12, color: theme.sub }}>
              {label}
            </Text>
          ))}
          {active && progress ? <Text style={s.sub}>{progress}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
export function MessageSources({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  const valid = sources.filter((x) => safeWebUrl(x.url));
  if (!valid.length) return null;
  return (
    <>
      <Press
        accessibilityRole="button"
        accessibilityLabel={`Sources, ${valid.length}`}
        onPress={() => setOpen(true)}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 22,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.line,
        }}
      >
        <Icon name="globe-outline" size={16} color={theme.sub} />
        <Text style={{ fontSize: 12, color: theme.ink }}>
          Sources · {valid.length}
        </Text>
        <Icon name="chevron-forward" size={14} color={theme.sub} />
      </Press>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <Page>
          <View style={[s.between, { minHeight: 56 }]}>
            <Text style={s.h2}>Sources</Text>
            <IconButton
              name="close"
              label="Close sources"
              onPress={() => setOpen(false)}
            />
          </View>
          <ScrollView contentContainerStyle={{ gap: 12, padding: 20 }}>
            {valid.map((source, i) => (
              <Press
                key={`${source.url}-${i}`}
                accessibilityRole="link"
                accessibilityLabel={`Open source ${i + 1}: ${source.title}`}
                onPress={() => {
                  void Linking.openURL(safeWebUrl(source.url)!).catch(() =>
                    Alert.alert(
                      "Could not open source",
                      "Please try again later.",
                    ),
                  );
                }}
                style={[s.card, { gap: 6 }]}
              >
                <Text
                  style={{ color: theme.ink, fontSize: 14, fontWeight: "600" }}
                >
                  {i + 1}. {source.title}
                </Text>
                <Text style={s.sub}>{new URL(source.url).hostname}</Text>
                <Text style={{ fontSize: 12, color: theme.accentText }}>
                  Open source ↗
                </Text>
              </Press>
            ))}
          </ScrollView>
        </Page>
      </Modal>
    </>
  );
}
