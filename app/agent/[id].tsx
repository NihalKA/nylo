import React, { useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { uid } from "../../src/domain";
import {
  AgentAvatar,
  Badge,
  Button,
  ConversationRow,
  Empty,
  Field,
  Header,
  IconButton,
  Page,
  confirm,
  s,
  theme,
} from "../../src/ui";

export default function AgentDetail() {
  const { id, section } = useLocalSearchParams<{
    id: string;
    section?: string;
  }>();
  const { data, newChat, update, runningId } = useStore();
  const agent = data.agents.find((a) => a.id === id);
  const [tab, setTab] = useState<"conversations" | "memory">(
    section === "memory" ? "memory" : "conversations",
  );
  const [memory, setMemory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (!agent)
    return (
      <Page>
        <Header title="Agent" />
        <Empty
          icon="sparkles-outline"
          title="Agent not found"
          body="It may have been removed from this device."
        />
      </Page>
    );
  const chats = data.conversations
    .filter(
      (c) => c.agentId === id && (c.messages.length > 0 || c.draft?.trim()),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const action = async (fn: () => Promise<unknown>) => {
    try {
      setError("");
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Page>
      <Header
        title="Your agent"
        right={
          <IconButton
            name="options-outline"
            label="Edit agent"
            onPress={() =>
              router.push({ pathname: "/agent/edit", params: { id } })
            }
          />
        }
      />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 16, paddingTop: 16, paddingBottom: 28 }}>
          <AgentAvatar agent={agent} large />
          <Text style={s.title}>{agent.name}</Text>
          <Text style={[s.text, { color: theme.sub }]}>
            {agent.description || "An assistant with a little continuity."}
          </Text>
          <Badge
            text={`${agent.memories.length} SAVED MEMORIES`}
            icon="sparkles-outline"
          />
          <Button
            title="New conversation"
            icon="add"
            onPress={() =>
              void action(async () => {
                const chatId = await newChat(id);
                router.push({ pathname: "/chat/[id]", params: { id: chatId } });
              })
            }
            style={{ alignSelf: "flex-start", marginTop: 4 }}
          />
        </View>
        <View
          style={[
            s.row,
            { borderBottomWidth: 1, borderColor: theme.line, gap: 26 },
          ]}
        >
          {(["conversations", "memory"] as const).map((t) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              key={t}
              onPress={() => setTab(t)}
              style={{
                paddingVertical: 14,
                borderBottomWidth: 2,
                borderBottomColor: tab === t ? theme.green : "transparent",
              }}
            >
              <Text
                style={{
                  color: tab === t ? theme.green : theme.sub,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {t === "conversations" ? "Conversations" : "Memory"}
              </Text>
            </Pressable>
          ))}
        </View>
        {tab === "conversations" ? (
          chats.length ? (
            chats.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                onPress={() =>
                  router.push({ pathname: "/chat/[id]", params: { id: c.id } })
                }
              />
            ))
          ) : (
            <Empty
              icon="chatbubbles-outline"
              title="A fresh conversation, familiar context"
              body="Instructions and approved memories carry into every new chat. To continue an earlier discussion, reopen its conversation here."
            />
          )
        ) : (
          <View style={{ gap: 16, marginTop: 22 }}>
            <Text style={s.sub}>
              These facts are included when you message this agent. You can
              review, edit, or remove them at any time.
            </Text>
            {agent.memories.map((m) => (
              <View key={m.id} style={[s.card, s.row, { gap: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.text}>{m.text}</Text>
                  <Text style={[s.sub, { fontSize: 11, marginTop: 8 }]}>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <IconButton
                  name="create-outline"
                  label="Edit memory"
                  onPress={() => {
                    setMemory(m.text);
                    setEditingId(m.id);
                  }}
                />
                <IconButton
                  name="trash-outline"
                  label="Forget memory"
                  onPress={() =>
                    void action(async () => {
                      if (
                        await confirm(
                          "Forget this memory?",
                          "It will no longer be included in this agent’s conversations.",
                        )
                      )
                        await update((d) => ({
                          ...d,
                          agents: d.agents.map((a) =>
                            a.id === id
                              ? {
                                  ...a,
                                  memories: a.memories.filter(
                                    (x) => x.id !== m.id,
                                  ),
                                }
                              : a,
                          ),
                        }));
                    })
                  }
                />
              </View>
            ))}
            {!agent.memories.length ? (
              <Empty
                icon="leaf-outline"
                title="A little context goes a long way"
                body="Save a writing preference, project decision, or something you would otherwise repeat."
              />
            ) : null}
            <Field
              testID="agent-memory-input"
              inputAccessoryViewID={
                Platform.OS === "ios" ? "memory-keyboard-toolbar" : undefined
              }
              label={editingId ? "Edit this memory" : "A fact to remember"}
              value={memory}
              onChangeText={setMemory}
              multiline
              maxLength={1000}
              placeholder="I prefer concise answers and practical examples."
            />
            <Button
              title={editingId ? "Update memory" : "Save memory"}
              secondary
              icon="add"
              disabled={
                !memory.trim() || (!editingId && agent.memories.length >= 50)
              }
              onPress={() =>
                void action(async () => {
                  await update((d) => ({
                    ...d,
                    agents: d.agents.map((a) =>
                      a.id === id
                        ? {
                            ...a,
                            memories: editingId
                              ? a.memories.map((m) =>
                                  m.id === editingId
                                    ? { ...m, text: memory.trim() }
                                    : m,
                                )
                              : [
                                  ...a.memories,
                                  {
                                    id: uid(),
                                    text: memory.trim(),
                                    createdAt: Date.now(),
                                  },
                                ],
                          }
                        : a,
                    ),
                  }));
                  setMemory("");
                  setEditingId(null);
                })
              }
            />
            {editingId ? (
              <Button
                title="Cancel editing"
                secondary
                onPress={() => {
                  setEditingId(null);
                  setMemory("");
                }}
              />
            ) : null}
          </View>
        )}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={{ marginTop: 40 }}>
          <Button
            title="Delete agent"
            secondary
            disabled={!!runningId}
            onPress={() =>
              void action(async () => {
                if (
                  await confirm(
                    "Delete this agent?",
                    "Its memory and conversations will also be deleted from this device. Export a backup first if you want to keep them.",
                  )
                ) {
                  await update((d) => ({
                    ...d,
                    agents: d.agents.filter((a) => a.id !== id),
                    conversations: d.conversations.filter(
                      (c) => c.agentId !== id,
                    ),
                  }));
                  router.replace("/");
                }
              })
            }
          />
        </View>
      </ScrollView>
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID="memory-keyboard-toolbar">
          <View
            style={{
              alignItems: "flex-end",
              backgroundColor: theme.card,
              borderTopWidth: 1,
              borderColor: theme.line,
              paddingHorizontal: 16,
            }}
          >
            <Button
              title="Done"
              secondary
              onPress={Keyboard.dismiss}
            />
          </View>
        </InputAccessoryView>
      ) : null}
    </Page>
  );
}
