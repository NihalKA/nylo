import { attachmentFlowReducer } from "../../src/attachment-flow";
import { modelChoices } from "../../src/model-library";
import { Attachment } from "../../src/types";
import { attachmentUri, validateAttachments } from "../../src/attachments";
import {
  pickAttachments,
  AttachmentSource,
  AttachmentPreparation,
} from "../../src/attachment-picker";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { isDeviceCheckConversation, starterDraft, uid } from "../../src/domain";
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
              backgroundColor: theme.surface,
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

export default function ChatRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <Chat key={params.id} />;
}

function Chat() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const { id, prompt } = useLocalSearchParams<{
    id: string;
    prompt?: string;
  }>();
  const { data, update, send, runningId, stop } = useStore();
  const conversation = data.conversations.find((c) => c.id === id);
  const agent = data.agents.find((a) => a.id === conversation?.agentId);
  const savedConnection = data.connections.find(
    (c) => c.id === (conversation?.connectionId || data.defaultConnectionId),
  );
  const connection = savedConnection
    ? {
        ...savedConnection,
        model: conversation?.model || savedConnection.model,
      }
    : undefined;
  const [attachments, setAttachments] = useState<Attachment[]>(
    conversation?.draftAttachments || [],
  );
  const [attachmentFlow, dispatchAttachment] = useReducer(
    attachmentFlowReducer,
    { kind: "idle" },
  );
  const [attachmentPreparation, setAttachmentPreparation] =
    useState<AttachmentPreparation | null>(null);
  const attachmentMenu = attachmentFlow.kind === "menu";
  const picking =
    attachmentFlow.kind === "closing" || attachmentFlow.kind === "picking";
  const [modelSearch, setModelSearch] = useState("");
  const [text, setText] = useState(prompt || conversation?.draft || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [menu, setMenu] = useState(false);
  const [modelPicker, setModelPicker] = useState(false);
  const [title, setTitle] = useState(conversation?.title || "");
  const [copied, setCopied] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const composer = useRef<React.ComponentRef<typeof TextInput>>(null);
  const nearBottom = useRef(true);
  const isRunning = runningId === id;
  const last = conversation?.messages.at(-1);
  useEffect(() => {
    setText(prompt || conversation?.draft || "");
    setAttachments(conversation?.draftAttachments || []);
    setError("");
  }, [id]);
  const draftValue = useRef({ id, text, attachments });
  draftValue.current = { id, text, attachments };
  const persistDraft = useRef(update);
  persistDraft.current = update;
  const saveDraft = useCallback(() => {
    const value = draftValue.current;
    void persistDraft
      .current((d) =>
        isDeviceCheckConversation(d, value.id)
          ? d
          : {
              ...d,
              conversations: d.conversations.map((c) =>
                c.id === value.id &&
                (c.draft !== value.text ||
                  c.draftAttachments !== value.attachments)
                  ? {
                      ...c,
                      draft: value.text,
                      draftAttachments: value.attachments,
                      updatedAt: Date.now(),
                    }
                  : c,
              ),
            },
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    const timer = setTimeout(saveDraft, 400);
    return () => clearTimeout(timer);
  }, [id, text, attachments, saveDraft]);
  useFocusEffect(useCallback(() => saveDraft, [saveDraft]));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") saveDraft();
    });
    return () => subscription.remove();
  }, [saveDraft]);
  const startedAttachment = useRef<string | null>(null);
  useEffect(() => {
    if (
      attachmentFlow.kind !== "picking" ||
      startedAttachment.current === attachmentFlow.operation
    )
      return;
    const { source, operation } = attachmentFlow;
    const chatId = id;
    startedAttachment.current = operation;
    setAttachmentPreparation(null);
    void (async () => {
      try {
        const picked = await pickAttachments(source, (stage) => {
          if (draftValue.current.id === chatId) setAttachmentPreparation(stage);
        });
        if (draftValue.current.id === chatId)
          setAttachments(
            validateAttachments([...draftValue.current.attachments, ...picked]),
          );
      } catch (e) {
        if (draftValue.current.id === chatId) setError((e as Error).message);
      } finally {
        dispatchAttachment({ type: "finished", operation });
      }
    })();
  }, [attachmentFlow, id]);
  if (isDeviceCheckConversation(data, id))
    return (
      <Page>
        <Header title="Device check" />
        <Text style={s.text}>
          This test conversation is managed by Live device check.
        </Text>
        <Button
          title="Open live device check"
          onPress={() => router.replace("/device-check")}
        />
      </Page>
    );
  if (!conversation)
    return (
      <Page>
        <Header title="Conversation" />
        <Text style={s.sub}>This conversation could not be found.</Text>
      </Page>
    );
  const submit = async () => {
    if ((!text.trim() && !attachments.length) || runningId || submitting)
      return;
    const value = text;
    const files = attachments;
    setSubmitting(true);
    setError("");
    nearBottom.current = true;
    try {
      await update((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === id ? { ...c, draft: value, draftAttachments: files } : c,
        ),
      }));
      await send(id, value, false, () => {
        setText((current) => (current === value ? "" : current));
        setAttachments((current) => (current === files ? [] : current));
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
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
  const queueAttachment = (source: AttachmentSource) => {
    dispatchAttachment({
      type: "choose",
      source,
      operation: uid(),
      waitForDismiss: Platform.OS === "ios",
    });
  };
  return (
    <Page>
      <Header
        dismissKeyboard={keyboardVisible}
        onDismissKeyboard={() => {
          composer.current?.blur();
          Keyboard.dismiss();
        }}
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
      {agent && !keyboardVisible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${agent.name} memory. ${agent.memories.length} saved facts shared across this agent’s conversations.`}
          onPress={() =>
            router.push({
              pathname: "/agent/[id]",
              params: { id: agent.id, section: "memory" },
            })
          }
          style={[
            s.row,
            {
              minHeight: 44,
              gap: 8,
              paddingVertical: 6,
              marginBottom: 4,
            },
          ]}
        >
          <Icon name="albums-outline" color={theme.sub} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={[s.sub, { fontSize: 13 }]}>
              Memory · {agent.memories.length} saved{" "}
              {agent.memories.length === 1 ? "fact" : "facts"}
            </Text>
          </View>
          <Icon name="chevron-forward" color={theme.sub} size={12} />
        </Pressable>
      ) : null}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top}
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
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
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
            if (!conversation.messages.length)
              scroll.current?.scrollTo({ y: 0, animated: false });
            else if (nearBottom.current)
              scroll.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            if (!conversation.messages.length)
              scroll.current?.scrollTo({ y: 0, animated: false });
            else if (nearBottom.current)
              scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          {!conversation.messages.length ? (
            <View
              style={{
                display: keyboardVisible ? "none" : "flex",
                flexGrow: 1,
                alignItems: "center",
                justifyContent: fontScale > 1.5 ? "flex-start" : "center",
                gap: 16,
                paddingVertical: 28,
              }}
            >
              {agent ? <AgentAvatar agent={agent} /> : null}
              <Text
                style={[
                  s.h2,
                  { textAlign: "center", fontSize: 26, letterSpacing: -0.7 },
                ]}
              >
                {agent ? `Work with ${agent.name}` : "Let’s begin"}
              </Text>
              <Text
                style={[
                  s.sub,
                  { textAlign: "center", maxWidth: 360, fontSize: 14 },
                ]}
              >
                {agent
                  ? `${agent.description || "Your instructions and approved memories are ready."}`
                  : "A question, a draft, or a fresh idea."}
              </Text>
              {!connection ? (
                <Button
                  title="Connect your first model"
                  onPress={() => router.push("/connection")}
                />
              ) : text.length === 0 && !attachments.length ? (
                <View style={{ gap: 4, marginTop: 8 }}>
                  {["Help me write", "Think it through"].map((label) => (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      onPress={() => {
                        setText((current) =>
                          starterDraft(
                            current,
                            label === "Help me write"
                              ? "Help me write "
                              : "Help me think through ",
                          ),
                        );
                        composer.current?.focus();
                      }}
                      style={[
                        s.row,
                        { gap: 10, minHeight: 44, paddingHorizontal: 16 },
                      ]}
                    >
                      <Icon
                        name={
                          label === "Help me write"
                            ? "create-outline"
                            : "bulb-outline"
                        }
                        size={17}
                        color={theme.sub}
                      />
                      <Text style={s.sub}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <>
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
                        backgroundColor: theme.surface,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 22,
                        maxWidth: "90%",
                      }}
                    >
                      {message.attachments?.map((file) => (
                        <View key={file.id} style={{ gap: 6, marginBottom: 8 }}>
                          {file.mimeType.startsWith("image/") ? (
                            <Image
                              source={{ uri: attachmentUri(file) }}
                              accessibilityLabel={`Attached photo: ${file.name}`}
                              style={{
                                width: 180,
                                height: 140,
                                borderRadius: 12,
                                maxWidth: "100%",
                              }}
                              resizeMode="contain"
                            />
                          ) : null}
                          <Text style={s.sub}>
                            {file.name} · {Math.ceil(file.size / 1024)} KB
                          </Text>
                        </View>
                      ))}
                      <Text
                        selectable
                        style={[s.text, { fontSize: 16, lineHeight: 25 }]}
                      >
                        {message.text}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {agent || message.status === "streaming" ? (
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
                          ) : null}
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: theme.sub,
                            }}
                          >
                            {agent?.name || "Nylo"}
                          </Text>
                          {message.status === "streaming" ? (
                            <ActivityIndicator size="small" color={theme.sub} />
                          ) : null}
                        </View>
                      ) : null}
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
                                minHeight: 44,
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
                          <IconButton
                            name="flag-outline"
                            label="Report response"
                            onPress={() =>
                              router.push({
                                pathname: "/report",
                                params: { chatId: id, messageId: message.id },
                              })
                            }
                          />
                          {agent ? (
                            <IconButton
                              name="bookmark-outline"
                              label="Review as memory"
                              onPress={() =>
                                router.push({
                                  pathname: "/agent/[id]",
                                  params: {
                                    id: agent.id,
                                    section: "memory",
                                    draftMemory: message.text.slice(0, 1000),
                                  },
                                })
                              }
                            />
                          ) : null}
                          {message.model &&
                          message.model !== connection?.model ? (
                            <Text style={[s.sub, { fontSize: 12, flex: 1 }]}>
                              {message.model}
                            </Text>
                          ) : null}
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
          {attachments.length ? (
            <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
              {attachments.map((file) => (
                <View
                  key={file.id}
                  style={[s.card, { padding: 10, gap: 4, width: 180 }]}
                >
                  {file.mimeType.startsWith("image/") ? (
                    <Image
                      source={{ uri: attachmentUri(file) }}
                      accessibilityLabel={`Preview ${file.name}`}
                      style={{ width: 140, height: 90, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  ) : null}
                  <Text numberOfLines={2} style={s.sub}>
                    {file.name} · {Math.ceil(file.size / 1024)} KB
                  </Text>
                  <Button
                    title={`Remove ${file.name}`}
                    secondary
                    onPress={() =>
                      setAttachments((current) =>
                        current.filter((a) => a.id !== file.id),
                      )
                    }
                  />
                </View>
              ))}
            </ScrollView>
          ) : null}
          {picking ? (
            <Text accessibilityLiveRegion="polite" style={s.sub}>
              {attachmentPreparation === "reading"
                ? "Reading attachment…"
                : attachmentPreparation === "encoding"
                  ? "Finishing photo…"
                  : attachmentPreparation === "preparing"
                    ? "Preparing attachment…"
                    : "Choosing attachment…"}
            </Text>
          ) : null}
          <View style={s.between}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose model connection${connection ? `. ${connection.name}, ${connection.model}` : ""}`}
              onPress={() => {
                composer.current?.blur();
                Keyboard.dismiss();
                data.connections.length
                  ? setModelPicker(true)
                  : router.push("/connection");
              }}
              style={[
                s.row,
                {
                  gap: 6,
                  alignSelf: "flex-start",
                  flex: 1,
                  minWidth: 0,
                  minHeight: 44,
                  paddingVertical: 6,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.6}
                style={{ fontSize: 13, color: theme.sub, flexShrink: 1 }}
              >
                {connection ? `${connection.model}` : "Choose a model"}
              </Text>
              <Icon name="chevron-down" size={12} color={theme.sub} />
            </Pressable>
          </View>
          <View
            style={[
              s.row,
              {
                alignItems: "flex-end",
                gap: 10,
                padding: 8,
                borderRadius: 28,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <IconButton
              name="add"
              label="Add attachment"
              disabled={picking || submitting || !!runningId}
              onPress={() => {
                composer.current?.blur();
                Keyboard.dismiss();
                dispatchAttachment({ type: "open" });
              }}
            />
            <TextInput
              ref={composer}
              accessibilityLabel="Message"
              testID="chat-message"
              value={text}
              onChangeText={setText}
              maxLength={20000}
              multiline
              placeholder={agent ? `Message ${agent.name}…` : "Message Nylo…"}
              placeholderTextColor={theme.sub}
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
                  borderRadius: 22,
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
                disabled={
                  (!text.trim() && !attachments.length) ||
                  !!runningId ||
                  submitting ||
                  picking
                }
                onPress={() => void submit()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    (text.trim() || attachments.length) && !runningId
                      ? theme.ink
                      : "#E1E1E4",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  name="arrow-up"
                  size={20}
                  color={
                    (text.trim() || attachments.length) && !runningId
                      ? "#FFF"
                      : "#9AA394"
                  }
                />
              </Pressable>
            )}
          </View>
          {runningId ? (
            <Text
              style={{ textAlign: "center", fontSize: 12, color: theme.sub }}
            >
              {runningId && !isRunning
                ? "Another conversation is responding."
                : isRunning
                  ? "Working on this device. Keep the app open."
                  : "Saved on this device. AI can make mistakes."}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={attachmentMenu}
        onDismiss={() => {
          if (attachmentFlow.kind === "closing") {
            dispatchAttachment({ type: "dismissed" });
          }
        }}
        transparent
        animationType="slide"
        onRequestClose={() => dispatchAttachment({ type: "cancel" })}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#00000055",
          }}
        >
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: "85%",
              padding: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              gap: 12,
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <ScrollView
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ gap: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text accessibilityRole="header" style={s.h2}>
                Attachments
              </Text>
              <Button
                title="Photo library"
                secondary
                icon="images-outline"
                onPress={() => queueAttachment("photos")}
              />
              <Button
                title="Take a photo"
                secondary
                icon="camera-outline"
                onPress={() => queueAttachment("camera")}
              />
              <Button
                title="Choose files"
                secondary
                icon="document-outline"
                onPress={() => queueAttachment("files")}
              />
              <Text style={s.sub}>
                Up to 4 files · 2 MB each, 4 MB total. Stored here until sent to
                your provider.
              </Text>
            </ScrollView>
            <Button
              title="Cancel attachments"
              secondary
              onPress={() => dispatchAttachment({ type: "cancel" })}
            />
          </View>
        </View>
      </Modal>
      <Modal
        visible={modelPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setModelPicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#00000055",
          }}
        >
          <Pressable
            accessible={false}
            onPress={() => setModelPicker(false)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: "80%",
              padding: 20,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: 12,
              backgroundColor: theme.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <View style={s.between}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.6}
                style={s.h2}
              >
                Choose a model
              </Text>
              <IconButton
                name="close"
                label="Close model picker"
                onPress={() => setModelPicker(false)}
              />
            </View>
            <Field
              testID="chat-model-search"
              label="Search models"
              value={modelSearch}
              onChangeText={setModelSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ flexGrow: 0, flexShrink: 1 }}
            >
              {modelChoices(data.connections)
                .filter((choice) =>
                  `${choice.connection.name} ${choice.model}`
                    .toLowerCase()
                    .includes(modelSearch.toLowerCase()),
                )
                .map(({ connection: c, model, id: choiceId }) => (
                  <Pressable
                    key={choiceId}
                    accessibilityRole="radio"
                    accessibilityLabel={`${c.name}. ${model}`}
                    accessibilityState={{
                      checked:
                        c.id === connection?.id && model === connection.model,
                    }}
                    disabled={!!runningId}
                    onPress={() =>
                      void action(async () => {
                        await update((d) => ({
                          ...d,
                          conversations: d.conversations.map((item) =>
                            item.id === id
                              ? { ...item, connectionId: c.id, model }
                              : item,
                          ),
                        }));
                        setModelPicker(false);
                      })
                    }
                    style={[
                      s.row,
                      {
                        minHeight: 68,
                        gap: 14,
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.line,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[s.text, { fontWeight: "600" }]}>
                        {c.name}
                      </Text>
                      <Text style={s.sub}>{model}</Text>
                    </View>
                    {c.id === connection?.id && model === connection.model ? (
                      <Icon name="checkmark" size={20} />
                    ) : null}
                  </Pressable>
                ))}
              <Text style={s.sub}>
                Conversation context goes with your next message. Selecting a
                model sends nothing.
              </Text>
              <Button
                title="Manage providers"
                secondary
                onPress={() => {
                  setModelPicker(false);
                  router.push("/connection");
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
                backgroundColor: theme.card,
                gap: 18,
                padding: 24,
              },
            ]}
          >
            <View style={s.between}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.6}
                numberOfLines={1}
                style={[s.h2, { flex: 1 }]}
              >
                Conversation settings
              </Text>
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
