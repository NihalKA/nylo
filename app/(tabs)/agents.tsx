import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
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
  const { data } = useStore();
  const create = () => router.push("/agent/edit");
  return (
    <Page>
      <View style={[s.between, { paddingTop: 16, paddingBottom: 18 }]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={s.title}
        >
          Agents
        </Text>
        <IconButton
          name="add"
          label="Create agent"
          color={theme.green}
          onPress={create}
        />
      </View>
      <FlatList
        data={data.agents}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        ListHeaderComponent={
          data.agents.length ? (
            <Text style={[s.sub, { marginBottom: 14 }]}>
              Your assistants. Each with a memory of its own.
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
                gap: 14,
                paddingVertical: 19,
                borderBottomWidth: 1,
                borderBottomColor: theme.line,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <AgentAvatar agent={item} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.text, { fontWeight: "600" }]}>{item.name}</Text>
              <Text numberOfLines={2} style={s.sub}>
                {item.description ||
                  "A personal assistant with its own instructions."}
              </Text>
              <Text style={{ fontSize: 12, color: theme.green, marginTop: 3 }}>
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
              flex: 1,
              justifyContent: "center",
              paddingBottom: 58,
              paddingTop: 40,
            }}
          >
            <View style={{ alignItems: "center", gap: 16 }}>
              <View
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 27,
                  backgroundColor: theme.pale,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Icon name="people-outline" color={theme.green} size={38} />
              </View>
              <Text style={[s.h2, { fontSize: 24, marginTop: 8 }]}>
                A little more familiar
              </Text>
              <Text
                style={[
                  s.text,
                  { color: theme.sub, textAlign: "center", maxWidth: 290 },
                ]}
              >
                Create an assistant for something you do often. Its instructions
                and saved memories carry into every new chat.
              </Text>
            </View>
            <View
              style={{ marginVertical: 28, gap: 18, paddingHorizontal: 12 }}
            >
              {[
                {
                  icon: "create-outline" as const,
                  title: "A writing partner",
                  body: "Keep your tone and preferences close.",
                },
                {
                  icon: "bulb-outline" as const,
                  title: "A thinking partner",
                  body: "Build on your ideas, one chat at a time.",
                },
              ].map(({ icon, title, body }) => (
                <View key={title} style={[s.row, { gap: 14 }]}>
                  <Icon name={icon} color={theme.green} size={22} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.text, { fontWeight: "600" }]}>{title}</Text>
                    <Text style={s.sub}>{body}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Button
              title="Create your first agent"
              icon="add"
              onPress={create}
            />
          </View>
        }
      />
    </Page>
  );
}
