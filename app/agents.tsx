import { Text } from "../src/typography";
import React, { useRef } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../src/store";
import { scrollTicker } from "../src/haptics";
import {
  AgentAvatar,
  Button,
  Chip,
  FabButton,
  FadeIn,
  Header,
  Icon,
  IconBubble,
  Page,
  Tappable,
  rgba,
  s,
  theme,
  useTheme,
} from "../src/ui";

// Soft, distinct tones for the three starter templates (light / dark).
const templateTones = [
  { bg: ["#EBF0FF", "#1C2440"], fg: ["#3358E0", "#93A8FF"] },
  { bg: ["#FFF3E0", "#33261A"], fg: ["#B45309", "#FFB870"] },
  { bg: ["#E6F6F0", "#16302A"], fg: ["#087B65", "#3CCB9F"] },
];

export default function Agents() {
  const { scheme } = useTheme();
  const tone = scheme === "dark" ? 1 : 0;
  const { fontScale } = useWindowDimensions();
  const { data } = useStore();
  const tick = useRef(scrollTicker(140)).current;
  // Cards cascade in only on first arrival, not while scrolling.
  const mountedAt = useRef(Date.now()).current;
  const agents = data.agents.filter((a) => a.id !== data.deviceCheck?.agentId);
  const create = () => router.push("/agent/edit");
  return (
    <Page aura>
      <Header
        title="Your agents"
        titleStyle={{ fontSize: 20 }}
        right={<FabButton name="add" label="Create agent" onPress={create} />}
      />
      <FlatList
        data={agents}
        keyExtractor={(a) => a.id}
        onScroll={(e) => tick(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
        ListHeaderComponent={
          agents.length ? (
            <Text style={[s.sub, { marginBottom: 14 }]}>
              A familiar starting point for the work you come back to.
            </Text>
          ) : undefined
        }
        renderItem={({ item, index }) => {
          const memories = `${item.memories.length} ${item.memories.length === 1 ? "memory" : "memories"}`;
          return (
            <FadeIn
              delay={Math.min(index, 6) * 45}
              enabled={index < 8 && Date.now() - mountedAt < 800}
            >
              <Tappable
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/agent/[id]",
                    params: { id: item.id },
                  })
                }
                feel="card"
                scaleTo={0.98}
                ripple={rgba(item.color, 0.45)}
                style={{
                  marginBottom: 14,
                  backgroundColor: theme.card,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: theme.hairline,
                  boxShadow: theme.cardShadow,
                }}
              >
                {/* Identity wash: the agent's own colour, softly lit. */}
                <View
                  style={{
                    height: 64,
                    borderTopLeftRadius: 23,
                    borderTopRightRadius: 23,
                    backgroundColor: rgba(item.color, 0.12),
                    backgroundImage: `radial-gradient(circle at 88% 0%, ${rgba(theme.accent2, 0.22)} 0%, ${rgba(theme.accent2, 0)} 60%), linear-gradient(120deg, ${rgba(item.color, 0.34)} 0%, ${rgba(item.color, 0.06)} 100%)`,
                    alignItems: "flex-end",
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: rgba(theme.card, 0.7),
                    }}
                  >
                    <Icon name="arrow-forward" size={15} color={theme.ink} />
                  </View>
                </View>
                <View style={{ marginTop: -30, paddingHorizontal: 16 }}>
                  <AgentAvatar agent={item} size={56} />
                </View>
                <View style={{ padding: 16, paddingTop: 10, gap: 4 }}>
                  <Text
                    style={[
                      s.text,
                      { fontSize: 18, fontWeight: "700", letterSpacing: -0.4 },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text numberOfLines={2} style={s.sub}>
                    {item.description ||
                      "A personal assistant with its own instructions."}
                  </Text>
                  <View
                    style={[s.row, { gap: 8, marginTop: 8, flexWrap: "wrap" }]}
                  >
                    <Chip
                      tone={item.memories.length ? "accent" : "neutral"}
                      icon="bookmark-outline"
                      text={memories}
                    />
                    {item.shareRecentChats ? (
                      <Chip
                        tone="neutral"
                        icon="time-outline"
                        text="Uses recent chats"
                      />
                    ) : null}
                  </View>
                </View>
              </Tappable>
            </FadeIn>
          );
        }}
        ListEmptyComponent={
          <FadeIn
            style={{
              flexGrow: 1,
              paddingBottom: 40,
              paddingTop: 28,
            }}
          >
            <View style={{ gap: 12 }}>
              <Text style={[s.h2, { fontSize: 20, letterSpacing: -0.4 }]}>
                No agents yet
              </Text>
              {fontScale <= 1.6 ? (
                <Text style={[s.text, { color: theme.sub, maxWidth: 350 }]}>
                  Give an agent instructions once. Keep the facts you approve
                  across its conversations.
                </Text>
              ) : null}
              <Button
                title="Create agent"
                icon="add"
                onPress={create}
                style={{ alignSelf: "flex-start" }}
              />
            </View>
            <Text style={[s.eyebrow, { marginTop: 32, marginBottom: 12 }]}>
              Start from a template
            </Text>
            <View style={{ gap: 12 }}>
              {[
                {
                  icon: "create-outline" as const,
                  title: "Writing partner",
                  body: "Drafts that sound like you.",
                },
                {
                  icon: "bulb-outline" as const,
                  title: "Thinking partner",
                  body: "Room to work through an idea.",
                },
                {
                  icon: "layers-outline" as const,
                  title: "Project guide",
                  body: "Keep decisions and next steps together.",
                },
              ].map(({ icon, title, body }, index) => (
                <Tappable
                  key={title}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/agent/edit",
                      params: { template: title },
                    })
                  }
                  feel="card"
                  scaleTo={0.98}
                  ripple={rgba(templateTones[index].fg[tone], 0.3)}
                  style={[
                    s.row,
                    {
                      gap: 16,
                      minHeight: 80,
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: theme.card,
                      borderWidth: 1,
                      borderColor: theme.hairline,
                      boxShadow: theme.cardShadow,
                    },
                  ]}
                >
                  <IconBubble
                    name={icon}
                    background={templateTones[index].bg[tone]}
                    color={templateTones[index].fg[tone]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.text, { fontWeight: "600" }]}>{title}</Text>
                    {fontScale <= 1.6 ? (
                      <Text style={s.sub}>{body}</Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-forward" color={theme.quiet} size={14} />
                </Tappable>
              ))}
            </View>
          </FadeIn>
        }
      />
    </Page>
  );
}
