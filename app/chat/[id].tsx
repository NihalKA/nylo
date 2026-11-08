import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import {
  AgentAvatar,
  Badge,
  Button,
  Field,
  Header,
  Icon,
  IconButton,
  Page,
  confirm,
  s,
  theme,
} from "../../src/ui";

function MessageText({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, index) =>
        block.startsWith("```") ? (
          <View
            key={index}
            style={{
              backgroundColor: "#EDEFEB",
              padding: 14,
              borderRadius: 12,
            }}
          >
            <Text
              selectable
              style={{
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 12,
                lineHeight: 20,
                color: theme.ink,
              }}
            >
              {block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "")}
            </Text>
          </View>
        ) : (
          <Text
            key={index}
            selectable
            style={[s.text, { fontSize: 16, lineHeight: 26 }]}
          >
            {block.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
              <Text
                key={i}
                style={
                  part.startsWith("**") ? { fontWeight: "600" } : undefined
                }
              >
                {part.startsWith("**") ? part.slice(2, -2) : part}
              </Text>
            ))}
          </Text>
        ),
      )}
    </View>
  );
}

export default function Chat() {
  const { id, prompt } = useLocalSearchParams<{
    id: string;
    prompt?: string;
  }>();
  const { data, update, send, runningId, stop } = useStore();
  const conversation = data.conversations.find((c) => c.id === id);
  const agent = data.agents.find((a) => a.id === conversation?.agentId);
  const connection = data.connections.find(
    (c) => c.id === (conversation?.connectionId || data.defaultConnectionId),
  );
  const [text, setText] = useState(prompt || conversation?.draft || "");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [title, setTitle] = useState(conversation?.title || "");
  const [copied, setCopied] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const nearBottom = useRef(true);
  const isRunning = runningId === id;
  const last = conversation?.messages.at(-1);
  useEffect(() => {
    setText(prompt || conversation?.draft || "");
    setError("");
  }, [id]);
  const draftValue = useRef({ id, text });
  draftValue.current = { id, text };
  const persistDraft = useRef(update);
  persistDraft.current = update;
  useEffect(() => {
    const save = () => {
      const value = draftValue.current;
      void persistDraft
        .current((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === value.id && c.draft !== value.text
              ? { ...c, draft: value.text }
              : c,
          ),
        }))
        .catch(() => {});
    };
    const timer = setTimeout(save, 400);
    return () => clearTimeout(timer);
  }, [id, text]);
  useEffect(
    () => () => {
      const value = draftValue.current;
      void persistDraft
        .current((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === value.id ? { ...c, draft: value.text } : c,
          ),
        }))
        .catch(() => {});
    },
    [],
  );
  if (!conversation)
    return (
      <Page>
        <Header title="Conversation" />
        <Text style={s.sub}>This conversation could not be found.</Text>
      </Page>
    );
  const submit = async () => {
    if (!text.trim() || runningId) return;
    const value = text;
    setText("");
    setError("");
    nearBottom.current = true;
    try {
      await send(id, value);
    } catch (e) {
      setText(value);
      setError((e as Error).message);
    }
  };
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
        title={
          agent?.name ||
          (conversation.messages.length ? conversation.title : "New chat")
        }
        right={
          <IconButton
            name="ellipsis-horizontal"
            label="Conversation options"
            onPress={() => {
              setTitle(conversation.title);
              setMenu(true);
            }}
          />
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : Platform.OS === "android"
              ? "height"
              : undefined
        }
      >
        <ScrollView
          ref={scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: 28,
            gap: 24,
            flexGrow: 1,
          }}
          onScroll={(event) => {
            const { contentOffset, layoutMeasurement, contentSize } =
              event.nativeEvent;
            nearBottom.current =
              contentSize.height - contentOffset.y - layoutMeasurement.height <
              120;
          }}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (nearBottom.current)
              scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          {!conversation.messages.length ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                paddingVertical: 40,
              }}
            >
              {agent ? (
                <AgentAvatar agent={agent} large />
              ) : (
                <View
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 23,
                    backgroundColor: theme.pale,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="aperture-outline" color={theme.green} size={38} />
                </View>
              )}
              <Text style={[s.title, { textAlign: "center", fontSize: 32 }]}>
                {agent ? `Chat with ${agent.name}` : "What’s on your mind?"}
              </Text>
              <Text
                style={[
                  s.sub,
                  { textAlign: "center", maxWidth: 360, fontSize: 14 },
                ]}
              >
                {agent
                  ? `${agent.description || "A familiar place to think."}\n${agent.memories.length} saved memories are available in this conversation.`
                  : "Ask a question or start with an idea."}
              </Text>
              {!connection ? (
                <Button
                  title="Connect your first model"
                  secondary
                  icon="key-outline"
                  onPress={() => router.push("/connection")}
                />
              ) : (
                <Badge text={connection.name} icon="flash-outline" />
              )}
            </View>
          ) : (
            <>
              <Text numberOfLines={2} style={[s.eyebrow, { marginBottom: 2 }]}>
                {conversation.title.toUpperCase()}
              </Text>
              {conversation.messages.map((message, index) => (
                <View
                  key={message.id}
                  style={{
                    gap: 10,
                    alignItems:
                      message.role === "user" ? "flex-end" : "stretch",
                  }}
                >
                  {message.role === "user" ? (
                    <View
                      style={{
                        backgroundColor: "#E8EDE4",
                        paddingVertical: 14,
                        paddingHorizontal: 18,
                        borderRadius: 18,
                        borderBottomRightRadius: 5,
                        maxWidth: "90%",
                      }}
                    >
                      <Text
                        selectable
                        style={[s.text, { fontSize: 16, lineHeight: 25 }]}
                      >
                        {message.text}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      <View style={[s.row, { gap: 8 }]}>
                        {agent ? (
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 7,
                              backgroundColor: agent.color + "15",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: agent.color,
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {agent.name[0]}
                            </Text>
                          </View>
                        ) : (
                          <Icon
                            name="aperture-outline"
                            size={20}
                            color={theme.green}
                          />
                        )}
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: theme.green,
                          }}
                        >
                          {agent?.name || "Nylo"}
                        </Text>
                        {message.status === "streaming" ? (
                          <ActivityIndicator size="small" color={theme.green} />
                        ) : null}
                      </View>
                      {message.actions?.map((label, i) => (
                        <View key={i} style={[s.row, { gap: 5 }]}>
                          <Icon
                            name="checkmark-circle-outline"
                            size={13}
                            color={theme.green}
                          />
                          <Text style={{ fontSize: 11, color: theme.green }}>
                            {label}
                          </Text>
                        </View>
                      ))}
                      {message.text ? (
                        <MessageText text={message.text} />
                      ) : message.status === "streaming" ? (
                        <Text style={s.sub}>Thinking…</Text>
                      ) : null}
                      {message.error ? (
                        <View
                          style={{
                            backgroundColor: "#F7EBE6",
                            padding: 13,
                            borderRadius: 11,
                            gap: 8,
                          }}
                        >
                          <Text style={s.error}>{message.error}</Text>
                          {index === conversation.messages.length - 1 ? (
                            <Button
                              title="Retry response"
                              secondary
                              disabled={!!runningId}
                              icon="refresh-outline"
                              onPress={() =>
                                void action(() => send(id, "", true))
                              }
                              style={{
                                alignSelf: "flex-start",
                                minHeight: 38,
                                paddingVertical: 8,
                              }}
                            />
                          ) : null}
                        </View>
                      ) : null}
                      {message.text && message.status !== "streaming" ? (
                        <View style={[s.row, { gap: 3 }]}>
                          <IconButton
                            name={
                              copied === message.id
                                ? "checkmark"
                                : "copy-outline"
                            }
                            label="Copy response"
                            onPress={() =>
                              void action(async () => {
                                await Clipboard.setStringAsync(message.text);
                                setCopied(message.id);
                                setTimeout(() => setCopied(null), 1500);
                              })
                            }
                          />
                          <Text style={{ fontSize: 10, color: theme.sub }}>
                            {message.model}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <View style={{ paddingBottom: 8, gap: 10 }}>
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose model connection"
            onPress={() =>
              data.connections.length
                ? setMenu(true)
                : router.push("/connection")
            }
            style={[
              s.row,
              {
                gap: 6,
                alignSelf: "flex-start",
                minHeight: 44,
                paddingVertical: 6,
              },
            ]}
          >
            <Icon name="flash-outline" size={12} color={theme.green} />
            <Text style={{ fontSize: 11, color: theme.sub }}>
              {connection
                ? `${connection.name} · ${connection.model}`
                : "Choose a connection"}
            </Text>
            <Icon name="chevron-down" size={12} color={theme.sub} />
          </Pressable>
          <View
            style={[
              s.row,
              {
                alignItems: "flex-end",
                gap: 10,
                padding: 11,
                borderWidth: 1,
                borderColor: theme.line,
                borderRadius: 19,
                backgroundColor: "#FFF",
              },
            ]}
          >
            <TextInput
              accessibilityLabel="Message"
              value={text}
              onChangeText={setText}
              maxLength={20000}
              multiline
              placeholder={agent ? `Message ${agent.name}…` : "Message Nylo…"}
              placeholderTextColor="#969E95"
              style={{
                flex: 1,
                fontSize: 16,
                lineHeight: 23,
                color: theme.ink,
                minHeight: 36,
                maxHeight: 150,
                paddingHorizontal: 5,
                paddingTop: 6,
                paddingBottom: 6,
              }}
              onKeyPress={(event) => {
                if (
                  Platform.OS === "web" &&
                  event.nativeEvent.key === "Enter" &&
                  !(event as unknown as { shiftKey: boolean }).shiftKey
                ) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            {isRunning ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Stop response"
                onPress={stop}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: theme.ink,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="stop" size={16} color="#FFF" />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send message"
                disabled={!text.trim() || !!runningId}
                onPress={() => void submit()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor:
                    text.trim() && !runningId ? theme.green : "#E6EAE2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name="arrow-up"
                  size={20}
                  color={text.trim() && !runningId ? "#FFF" : "#9AA394"}
                />
              </Pressable>
            )}
          </View>
          <Text style={{ textAlign: "center", fontSize: 10, color: theme.sub }}>
            {runningId && !isRunning
              ? "Another conversation is responding."
              : isRunning
                ? "Working on this device. Keep the app open."
                : "Saved on this device. AI can make mistakes."}
          </Text>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={menu}
        transparent
        animationType="fade"
        onRequestClose={() => setMenu(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#17221A66",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={[
              s.card,
              {
                width: "100%",
                maxWidth: 440,
                maxHeight: "85%",
                gap: 18,
                padding: 24,
              },
            ]}
          >
            <View style={s.between}>
              <Text style={s.h2}>Conversation settings</Text>
              <IconButton
                name="close"
                label="Close conversation settings"
                onPress={() => setMenu(false)}
              />
            </View>
            <ScrollView
              contentContainerStyle={{ gap: 17 }}
              keyboardShouldPersistTaps="handled"
            >
              <Field
                label="Conversation title"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Button
                title="Save title"
                secondary
                onPress={() =>
                  void action(async () => {
                    await update((d) => ({
                      ...d,
                      conversations: d.conversations.map((c) =>
                        c.id === id
                          ? { ...c, title: title.trim() || "New conversation" }
                          : c,
                      ),
                    }));
                    setMenu(false);
                  })
                }
              />
              <Text style={s.eyebrow}>MODEL CONNECTION</Text>
              {data.connections.length ? (
                data.connections.map((c) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: connection?.id === c.id }}
                    disabled={!!runningId}
                    key={c.id}
                    onPress={() =>
                      void action(async () => {
                        await update((d) => ({
                          ...d,
                          conversations: d.conversations.map((item) =>
                            item.id === id
                              ? { ...item, connectionId: c.id }
                              : item,
                          ),
                        }));
                        setMenu(false);
                      })
                    }
                    style={[
                      s.card,
                      {
                        padding: 13,
                        backgroundColor:
                          connection?.id === c.id ? theme.pale : "#FFF",
                      },
                    ]}
                  >
                    <Text style={s.text}>{c.name}</Text>
                    <Text style={s.sub}>{c.model}</Text>
                  </Pressable>
                ))
              ) : (
                <Button
                  title="Add a connection"
                  secondary
                  onPress={() => {
                    setMenu(false);
                    router.push("/connection");
                  }}
                />
              )}
              {!agent ? (
                <View
                  style={{
                    gap: 10,
                    borderTopWidth: 1,
                    borderColor: theme.line,
                    paddingTop: 17,
                  }}
                >
                  <Text style={s.h2}>Keep the context going</Text>
                  <Text style={s.sub}>
                    Turn this conversation into an agent with its own brief and
                    memory.
                  </Text>
                  <Button
                    title="Create agent from chat"
                    icon="sparkles-outline"
                    disabled={!!runningId}
                    onPress={() => {
                      setMenu(false);
                      router.push({
                        pathname: "/agent/edit",
                        params: { fromChat: id },
                      });
                    }}
                  />
                </View>
              ) : (
                <Button
                  title="Open agent memory"
                  secondary
                  icon="sparkles-outline"
                  onPress={() => {
                    setMenu(false);
                    router.push({
                      pathname: "/agent/[id]",
                      params: { id: agent.id, section: "memory" },
                    });
                  }}
                />
              )}
              <Button
                title="Delete conversation"
                secondary
                disabled={!!runningId}
                onPress={() =>
                  void action(async () => {
                    if (
                      await confirm(
                        "Delete conversation?",
                        "This removes the conversation from this device.",
                      )
                    ) {
                      await update((d) => ({
                        ...d,
                        conversations: d.conversations.filter(
                          (c) => c.id !== id,
                        ),
                      }));
                      setMenu(false);
                      router.replace("/");
                    }
                  })
                }
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
