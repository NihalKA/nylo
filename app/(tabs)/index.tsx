import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { isDeviceCheckConversation } from "../../src/domain";
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
  const { fontScale } = useWindowDimensions();
  const { data, newChat } = useStore();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const chats = useMemo(
    () =>
      data.conversations
        .filter((c) => !isDeviceCheckConversation(data, c.id))
        .filter(
          (c) =>
            c.messages.length > 0 ||
            c.draft?.trim() ||
            !!c.draftAttachments?.length,
        )
        .filter((c) => {
          const agent = data.agents.find((a) => a.id === c.agentId);
          const needle = query.trim().toLocaleLowerCase();
          return (
            !needle ||
            `${c.title} ${c.draft || ""} ${agent?.name || ""}`
              .toLocaleLowerCase()
              .includes(needle) ||
            c.messages.some((m) => m.text.toLocaleLowerCase().includes(needle))
          );
        })
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [data.conversations, data.agents, data.deviceCheck, query],
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
      <View style={[s.between, { paddingTop: 12, paddingBottom: 18, gap: 16 }]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.6}
          style={s.title}
        >
          Chats
        </Text>
        <View style={{ borderRadius: 22, backgroundColor: theme.ink }}>
          <IconButton
            name="create-outline"
            label="New chat"
            color="#FFFFFF"
            onPress={() => void start()}
          />
        </View>
      </View>
      <View
        style={[
          s.row,
          {
            backgroundColor: theme.surface,
            borderRadius: 22,
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
          !data.connections.length && chats.length ? (
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
              <Icon name="key-outline" color={theme.ink} />
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
              flexGrow: 1,
              justifyContent: fontScale > 1.6 ? "flex-start" : "center",
              alignItems: "center",
              paddingBottom: 56,
              paddingTop: 32,
            }}
          >
            <Text
              style={[
                s.h2,
                {
                  fontSize: 20,
                  textAlign: "center",
                  marginBottom: 10,
                  letterSpacing: -0.7,
                },
              ]}
            >
              {query ? "No chats found" : "No chats yet"}
            </Text>
            {fontScale <= 1.6 ? (
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
                  : "Your questions, drafts and ideas.\nSaved here as you go."}
              </Text>
            ) : null}
            {!query ? (
              <Button title="New chat" onPress={() => void start()} />
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
          </View>
        }
      />
    </Page>
  );
}
