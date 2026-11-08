import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import {
  Button,
  ConversationRow,
  Icon,
  IconButton,
  Page,
  s,
  theme,
} from "../../src/ui";
export default function Chats() {
  const { data, newChat } = useStore();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const chats = useMemo(
    () =>
      data.conversations
        .filter((c) => {
          const agent = data.agents.find((a) => a.id === c.agentId);
          const needle = query.trim().toLocaleLowerCase();
          return (
            !needle ||
            `${c.title} ${agent?.name || ""}`
              .toLocaleLowerCase()
              .includes(needle) ||
            c.messages.some((m) => m.text.toLocaleLowerCase().includes(needle))
          );
        })
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [data.conversations, data.agents, query],
  );
  const start = async () => {
    try {
      const id = await newChat();
      router.push({ pathname: "/chat/[id]", params: { id } });
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Page>
      <View style={[s.between, { paddingTop: 16, paddingBottom: 18 }]}>
        <Text accessibilityRole="header" style={s.title}>
          Chats
        </Text>
        <IconButton
          name="create-outline"
          label="New chat"
          color={theme.green}
          onPress={() => void start()}
        />
      </View>
      <View
        style={[
          s.row,
          {
            backgroundColor: "#F1F4F2",
            borderRadius: 12,
            paddingHorizontal: 12,
            gap: 8,
            marginBottom: 16,
          },
        ]}
      >
        <Icon name="search-outline" color={theme.sub} size={20} />
        <TextInput
          accessibilityLabel="Search chats"
          placeholder="Search"
          placeholderTextColor={theme.sub}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 46,
            fontSize: 17,
            color: theme.ink,
            paddingVertical: 10,
          }}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      ) : undefined}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        ListHeaderComponent={
          !data.connections.length && data.conversations.length ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/connection")}
              style={[
                s.row,
                {
                  gap: 12,
                  backgroundColor: theme.pale,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 4,
                },
              ]}
            >
              <Icon name="key-outline" color={theme.green} />
              <View style={{ flex: 1 }}>
                <Text style={[s.text, { fontWeight: "600" }]}>
                  Connect an AI provider
                </Text>
                <Text style={s.sub}>Use your own API key to get replies.</Text>
              </View>
              <Icon name="chevron-forward" color={theme.green} size={16} />
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            agent={data.agents.find((a) => a.id === item.agentId)}
            onPress={() =>
              router.push({ pathname: "/chat/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 70,
              paddingTop: 42,
            }}
          >
            <View
              style={{
                width: 82,
                height: 82,
                borderRadius: 27,
                backgroundColor: theme.pale,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Icon
                name={query ? "search-outline" : "chatbubbles-outline"}
                size={38}
                color={theme.green}
              />
            </View>
            <Text
              style={[
                s.h2,
                { fontSize: 24, textAlign: "center", marginBottom: 10 },
              ]}
            >
              {query ? "No chats found" : "Your next idea starts here"}
            </Text>
            <Text
              style={[
                s.text,
                {
                  color: theme.sub,
                  textAlign: "center",
                  maxWidth: 285,
                  marginBottom: 28,
                },
              ]}
            >
              {query
                ? "Try a different word or search an agent’s name."
                : "Ask a question, work through an idea, or find the right words."}
            </Text>
            {!query ? (
              <Button
                title="Start a chat"
                icon="add"
                onPress={() => void start()}
              />
            ) : (
              <Button
                title="Clear search"
                secondary
                onPress={() => setQuery("")}
              />
            )}
            {!query && !data.connections.length ? (
              <Text
                style={[
                  s.sub,
                  { textAlign: "center", maxWidth: 290, marginTop: 16 },
                ]}
              >
                You’ll need your own AI provider API key for replies. Provider
                charges apply.
              </Text>
            ) : null}
            {!query ? (
              <View style={[s.row, { gap: 6, marginTop: 28 }]}>
                <Icon
                  name="phone-portrait-outline"
                  size={14}
                  color={theme.sub}
                />
                <Text style={s.sub}>Your history stays on this device.</Text>
              </View>
            ) : null}
          </View>
        }
      />
    </Page>
  );
}
