import { recentAgentContext } from "../../src/agent-context";
import React, { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
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

export default function AgentRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <AgentDetail key={params.id} />;
}

function AgentDetail() {
  const { fontScale } = useWindowDimensions();
  const { id, section, draftMemory } = useLocalSearchParams<{
    id: string;
    section?: string;
    draftMemory?: string;
  }>();
  const { data, newChat, update, runningId } = useStore();
  const agent = data.agents.find((a) => a.id === id);
  const [tab, setTab] = useState<"conversations" | "memory">(
    section === "memory" ? "memory" : "conversations",
  );
  const content = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const memoryTop = useRef(0);
  const [memory, setMemory] = useState(draftMemory?.slice(0, 1000) || "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const actionLocked = useRef(false);
  const [error, setError] = useState("");
  if (id === data.deviceCheck?.agentId)
    return (
      <Page>
        <Header title="Device check" />
        <Text style={s.text}>
          This test agent is managed by Live device check.
        </Text>
        <Button
          title="Open live device check"
          onPress={() => router.replace("/device-check")}
        />
      </Page>
    );
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
      (c) =>
        c.agentId === id &&
        (c.messages.length > 0 ||
          c.draft?.trim() ||
          !!c.draftAttachments?.length),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const action = async (fn: () => Promise<unknown>) => {
    if (actionLocked.current) return;
    actionLocked.current = true;
    try {
      setError("");
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      actionLocked.current = false;
    }
  };
  return (
    <Page>
      <Header
        title="Agent"
        dismissKeyboard
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
        ref={content}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 20, paddingTop: 20, paddingBottom: 24 }}>
          <View style={[s.row, { alignItems: "flex-start", gap: 16 }]}>
            <AgentAvatar agent={agent} />
            <View style={{ flex: 1, gap: 7 }}>
              <Text style={[s.h2, { fontSize: 26, letterSpacing: -0.7 }]}>
                {agent.name}
              </Text>
              <Text style={s.sub}>
                {agent.description || "Your instructions. Your saved context."}
              </Text>
            </View>
          </View>
          <Button
            title="New conversation"
            icon="add"
            onPress={() =>
              void action(async () => {
                const chatId = await newChat(id);
                router.push({ pathname: "/chat/[id]", params: { id: chatId } });
              })
            }
          />
        </View>
        <View
          style={[
            s.row,
            {
              backgroundColor: theme.surface,
              borderRadius: 14,
              padding: 4,
              gap: 4,
              flexWrap: "wrap",
            },
          ]}
        >
          {(["conversations", "memory"] as const).map((t) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              key={t}
              onPress={() => setTab(t)}
              style={{
                minHeight: 44,
                maxWidth: "100%",
                flexShrink: 1,
                flexGrow: 1,
                minWidth: "40%",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: tab === t ? theme.card : "transparent",
              }}
            >
              <Text
                style={{
                  color: tab === t ? theme.ink : theme.sub,
                  fontWeight: "600",
                  fontSize: 15,
                  maxWidth: "100%",
                  textAlign: "center",
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
          <View
            onLayout={(event) => {
              memoryTop.current = event.nativeEvent.layout.y;
            }}
            style={{ gap: 16, marginTop: 22 }}
          >
            <Field
              testID="agent-memory-input"
              label={editingId ? "Edit memory" : "New memory"}
              value={memory}
              onChangeText={setMemory}
              multiline
              maxLength={1000}
              placeholder="Add a useful fact…"
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
            <Text style={s.h2}>Saved memories</Text>
            <Text style={s.sub}>
              These facts are included when you message this agent. You can
              review, edit, or remove them at any time.
            </Text>
            {agent.memories.map((m) => (
              <View
                key={m.id}
                style={[
                  s.row,
                  {
                    gap: 8,
                    flexDirection: fontScale > 1.5 ? "column" : "row",
                    alignItems: fontScale > 1.5 ? "stretch" : "center",
                    paddingVertical: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.line,
                  },
                ]}
              >
                <View
                  style={{
                    flex: fontScale > 1.5 ? undefined : 1,
                    maxWidth: "100%",
                  }}
                >
                  <Text style={s.text}>{m.text}</Text>
                  <Text style={[s.sub, { fontSize: 12, marginTop: 6 }]}>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[s.row, { gap: 4, alignSelf: "flex-end" }]}>
                  <IconButton
                    name="create-outline"
                    label="Edit memory"
                    onPress={() => {
                      setMemory(m.text);
                      setEditingId(m.id);
                      content.current?.scrollTo({
                        y: memoryTop.current,
                        animated: true,
                      });
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
                            "This removes the saved fact. Text mentioning it can still be included from recent chats while that setting is enabled. Turn off recent context or delete source chats to stop those excerpts.",
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
              </View>
            ))}
            {!agent.memories.length ? (
              <Text style={s.sub}>No saved facts yet.</Text>
            ) : null}

            {agent.goal ? (
              <View style={{ gap: 6 }}>
                <Text style={s.h2}>Current goal</Text>
                <Text style={s.text}>{agent.goal}</Text>
              </View>
            ) : null}
            <Text style={s.h2}>Context between chats</Text>
            <View style={[s.between, { gap: 12 }]}>
              <Text style={[s.text, { flex: 1 }]}>Use recent chats</Text>
              <Switch
                accessibilityLabel="Use recent chats from this agent"
                value={!!agent.shareRecentChats}
                disabled={!!runningId}
                onValueChange={(value) =>
                  void action(async () => {
                    if (
                      value &&
                      !(await confirm(
                        "Share recent agent chats?",
                        "Future messages include bounded text excerpts from up to eight recent chats with this agent. They go to the selected provider. Other agents stay separate. Files themselves are excluded; conversation text quoting or discussing them may be included. Removing a saved memory does not remove its mentions in chat history; turn this off or delete the source chat too.",
                        "Enable context",
                        false,
                      ))
                    )
                      return;
                    await update((d) => ({
                      ...d,
                      agents: d.agents.map((a) =>
                        a.id === id ? { ...a, shareRecentChats: value } : a,
                      ),
                    }));
                  })
                }
              />
            </View>
            <Text style={s.sub}>
              Saved memories are durable facts. Recent context helps continue
              earlier work; it is a limited excerpt, not perfect recall of every
              conversation. Deleting a memory does not erase the original chats.
            </Text>
            {agent.shareRecentChats ? (
              <>
                <Button
                  title={
                    showContext
                      ? "Hide recent context"
                      : "Review recent context"
                  }
                  secondary
                  onPress={() => setShowContext(!showContext)}
                />
                {showContext ? (
                  <Text selectable style={s.sub}>
                    {recentAgentContext(data, agent, "") ||
                      "No earlier conversation text yet."}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
        )}
        {error ? <Text style={s.error}>{error}</Text> : null}
        <View style={{ marginTop: 40 }}>
          <Button
            title="Delete agent"
            secondary
            destructive
            disabled={!!runningId}
            style={{ backgroundColor: "transparent" }}
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
    </Page>
  );
}
