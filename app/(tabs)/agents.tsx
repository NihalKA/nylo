import { Text } from "../../src/typography";
import React from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import {
  AgentAvatar,
  Button,
  Icon,
  IconButton,
  Page,
  s,
  theme,
} from "../../src/ui";
export default function Agents() {
  const { fontScale } = useWindowDimensions();
  const { data } = useStore();
  const agents = data.agents.filter((a) => a.id !== data.deviceCheck?.agentId);
  const create = () => router.push("/agent/edit");
  return (
    <Page>
      <View style={[s.between, { paddingTop: 12, paddingBottom: 18 }]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={s.title}
        >
          Agents
        </Text>
        <View style={{ borderRadius: 22, backgroundColor: theme.primary }}>
          <IconButton
            name="add"
            label="Create agent"
            color="#FFFFFF"
            onPress={create}
          />
        </View>
      </View>
      <FlatList
        data={agents}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        ListHeaderComponent={
          agents.length ? (
            <Text style={[s.sub, { marginBottom: 14 }]}>
              A familiar starting point for the work you come back to.
            </Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
            onPress={() =>
              router.push({ pathname: "/agent/[id]", params: { id: item.id } })
            }
            style={({ pressed }) => [
              s.row,
              {
                gap: 16,
                padding: 16,
                marginBottom: 10,
                backgroundColor: theme.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.line,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <AgentAvatar agent={item} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[
                  s.text,
                  { fontSize: 17, fontWeight: "600", letterSpacing: -0.3 },
                ]}
              >
                {item.name}
              </Text>
              <Text numberOfLines={2} style={s.sub}>
                {item.description ||
                  "A personal assistant with its own instructions."}
              </Text>
              <Text style={{ fontSize: 12, color: theme.sub, marginTop: 3 }}>
                {item.memories.length}{" "}
                {item.memories.length === 1 ? "memory" : "memories"}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color={theme.sub} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View
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
              <Button title="Create agent" icon="add" onPress={create} />
            </View>
            <View style={{ marginVertical: 24 }}>
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
              ].map(({ icon, title, body }) => (
                <Pressable
                  key={title}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/agent/edit",
                      params: { template: title },
                    })
                  }
                  style={[
                    s.row,
                    {
                      gap: 16,
                      minHeight: 80,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.line,
                    },
                  ]}
                >
                  <Icon name={icon} color={theme.ink} size={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.text, { fontWeight: "600" }]}>{title}</Text>
                    {fontScale <= 1.6 ? (
                      <Text style={s.sub}>{body}</Text>
                    ) : null}
                  </View>
                  <Icon name="chevron-forward" color={theme.sub} size={14} />
                </Pressable>
              ))}
            </View>
          </View>
        }
      />
    </Page>
  );
}
