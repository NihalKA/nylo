import { MessageContent } from "../../src/message-content";
import { MessageActivity, MessageSources } from "../../src/message-activity";
import { DocumentPreviewModal } from "../../src/document-preview-modal";
import { openPdfPreview } from "../../src/document-preview";
import { stageLabels } from "../../src/response-progress";
import { shareGeneratedFile, exportResponse } from "../../src/file-export";
import { BlurTargetView, BlurView } from "expo-blur";
import { Text, TextInput, fonts } from "../../src/typography";
import { attachmentFlowReducer } from "../../src/attachment-flow";
import { modelSections } from "../../src/model-library";
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
  AppState,
  Linking,
  Keyboard,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import {
  contextMessages,
  isDeviceCheckConversation,
  starterDraft,
  uid,
} from "../../src/domain";
import {
  AgentAvatar,
  Badge,
  Breathe,
  Button,
  FadeIn,
  Field,
  Header,
  Icon,
  IconButton,
  Page,
  PopIn,
  PulseRing,
  Tappable,
  TypingDots,
  Burst,
  StreamCaret,
  haptic,
  BrandMark,
  ThinkingOrb,
  accentGradient,
  rgba,
  confirm,
  s,
  theme,
  softShadow,
  useTheme,
  LivingAvatar,
  Press,
} from "../../src/ui";

export default function ChatRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  return <Chat key={params.id} />;
}

function Chat() {
  const { scheme } = useTheme();
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
  const { data, update, send, runningId, responseProgress, stop } = useStore();
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
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const [text, setText] = useState(prompt || conversation?.draft || "");
  const [error, setError] = useState("");
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [menu, setMenu] = useState(false);
  const [modelPicker, setModelPicker] = useState(false);
  const [title, setTitle] = useState(conversation?.title || "");
  const [copied, setCopied] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const composer = useRef<React.ComponentRef<typeof TextInput>>(null);
  const nearBottom = useRef(true);
  const isRunning = runningId === id;
  const [progressNow, setProgressNow] = useState(Date.now());
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setProgressNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);
  const progressLabel = responseProgress
    ? `${stageLabels[responseProgress.stage]} · ${Math.max(0, Math.floor((progressNow - responseProgress.startedAt) / 1000))}s`
    : "Waiting for the model";
  const hasSavedFilesInTurn = conversation?.messages
    .slice(conversation.messages.findLastIndex((m) => m.role === "user") + 1)
    .some((m) => m.generatedFiles?.length);

  // Feel the reply arrive: a settled double pulse, or an error feel.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !isRunning) {
      const reply = conversation?.messages.at(-1);
      if (reply?.role === "assistant") {
        if (reply.status === "error") haptic.error();
        else if (reply.status === "complete") haptic.landed();
      }
    }
    wasRunning.current = isRunning;
  }, [isRunning]);
  const last = conversation?.messages.at(-1);
  const initialMessageIds = useRef(
    new Set(conversation?.messages.map((m) => m.id) ?? []),
  ).current;
  const [composerFocused, setComposerFocused] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const canSend = !!(text.trim() || attachments.length) && !runningId;
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
    setError("");
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
  const historyHasPdf = contextMessages(conversation.messages).some((message) =>
    message.attachments?.some((file) => file.mimeType === "application/pdf"),
  );
  const hasPdf =
    historyHasPdf ||
    attachments.some((file) => file.mimeType === "application/pdf");
  const needsPdfConnection = hasPdf && connection?.protocol === "compatible";
  const openModelPicker = () => {
    composer.current?.blur();
    Keyboard.dismiss();
    setModelSearch("");
    data.connections.length ? setModelPicker(true) : router.push("/connection");
  };
  const removeAttachment = (attachmentId: string) => {
    const current = draftValue.current;
    const next = current.attachments.filter((file) => file.id !== attachmentId);
    // Persist this exact removal immediately, including a same-frame navigation.
    draftValue.current = { ...current, attachments: next };
    setAttachments(next);
    setError("");
    saveDraft();
  };
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
    <Page aura={!conversation.messages.length}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <Header
          centerTitle={!agent && !conversation.messages.length}
          dismissKeyboard={keyboardVisible}
          onDismissKeyboard={() => {
            composer.current?.blur();
            Keyboard.dismiss();
          }}
          titleStyle={{
            fontSize: !conversation.messages.length ? 22 : 18,
            fontWeight: conversation.messages.length || hasPdf ? "700" : "600",
            letterSpacing:
              !conversation.messages.length && hasPdf ? -0.33 : -0.45,
            color:
              conversation.messages.length || hasPdf ? theme.text : theme.ink,
          }}
          title={
            agent?.name ||
            (conversation.messages.length ? conversation.title : "New chat")
          }
          right={
            <IconButton
              name="ellipsis-horizontal"
              design="chatMore"
              label="Conversation options"
              onPress={() => {
                setTitle(conversation.title);
                setMenu(true);
              }}
            />
          }
        />
        {agent && !keyboardVisible ? (
          <Press
            feel="tick"
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
          </Press>
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
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 28,
              gap: 24,
              flexGrow: 1,
            }}
            onScroll={(event) => {
              const { contentOffset, layoutMeasurement, contentSize } =
                event.nativeEvent;
              nearBottom.current =
                contentSize.height -
                  contentOffset.y -
                  layoutMeasurement.height <
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
                {agent ? (
                  <LivingAvatar agent={agent} size={68} />
                ) : (
                  <BrandMark height={56} float />
                )}
                <Text
                  style={[
                    s.h2,
                    {
                      textAlign: "center",
                      fontSize: !agent && attachmentMenu ? 32 : 28,
                      fontWeight: "700",
                      letterSpacing: !agent && attachmentMenu ? -0.8 : -0.7,
                      color: hasPdf ? theme.text : theme.ink,
                    },
                  ]}
                >
                  {agent ? `Work with ${agent.name}` : "Let’s begin"}
                </Text>
                <Text
                  style={[
                    s.sub,
                    {
                      textAlign: "center",
                      maxWidth: 360,
                      fontSize: 14,
                      color: agent ? theme.sub : theme.quiet,
                    },
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
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    {["Help me write", "Think it through"].map((label, i) => (
                      <FadeIn key={label} delay={120 + i * 80}>
                        <Tappable
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
                            haptic.select();
                            composer.current?.focus();
                          }}
                          scaleTo={0.94}
                          style={[
                            s.row,
                            {
                              gap: 8,
                              minHeight: 44,
                              paddingHorizontal: 16,
                              borderRadius: 22,
                              backgroundColor: theme.card,
                              borderWidth: 1,
                              borderColor: theme.hairline,
                              boxShadow: theme.cardShadow,
                            },
                          ]}
                        >
                          <Icon
                            name={
                              label === "Help me write"
                                ? "create-outline"
                                : "bulb-outline"
                            }
                            size={16}
                            color={theme.accentText}
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: theme.ink,
                            }}
                          >
                            {label}
                          </Text>
                        </Tappable>
                      </FadeIn>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <>
                {conversation.messages.map((message, index) => (
                  <FadeIn
                    key={message.id}
                    enabled={!initialMessageIds.has(message.id)}
                    distance={message.role === "user" ? 14 : 8}
                    style={{
                      gap: 10,
                      alignItems:
                        message.role === "user" ? "flex-end" : "stretch",
                    }}
                  >
                    {message.role === "user" ? (
                      <View
                        style={{
                          backgroundColor: theme.pale,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 22,
                          borderBottomRightRadius: 6,
                          maxWidth: "90%",
                        }}
                      >
                        {message.attachments?.map((file) => (
                          <View
                            key={file.id}
                            style={{ gap: 6, marginBottom: 8 }}
                          >
                            {file.mimeType.startsWith("image/") ? (
                              <Press
                                accessibilityRole="button"
                                accessibilityLabel={`Open image: ${file.name}`}
                                accessibilityHint="Opens a local image preview"
                                onPress={() => {
                                  Keyboard.dismiss();
                                  setPreviewFile(file);
                                }}
                              >
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
                              </Press>
                            ) : null}
                            <Text style={s.sub}>
                              {file.name} · {Math.ceil(file.size / 1024)} KB
                            </Text>
                          </View>
                        ))}
                        <Text
                          selectable
                          style={[s.text, { fontSize: 14, lineHeight: 20 }]}
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
                            {message.status === "streaming" && message.text ? (
                              <TypingDots color={theme.accentText} size={5} />
                            ) : null}
                          </View>
                        ) : null}
                        <MessageActivity
                          actions={message.actions}
                          active={message.status === "streaming"}
                          progress={progressLabel}
                        />
                        {message.generatedFiles?.map((file) => (
                          <View key={file.id} style={{ gap: 8 }}>
                            {file.mimeType.startsWith("image/") ? (
                              <Press
                                accessibilityRole="button"
                                accessibilityLabel={`Open image: ${file.name}`}
                                accessibilityHint="Opens a local image preview"
                                onPress={() => {
                                  Keyboard.dismiss();
                                  setPreviewFile(file);
                                }}
                              >
                                <Image
                                  source={{ uri: attachmentUri(file) }}
                                  accessibilityLabel={`Generated image: ${file.name}`}
                                  style={{
                                    width: "100%",
                                    height: 280,
                                    borderRadius: 16,
                                    backgroundColor: theme.card,
                                  }}
                                  resizeMode="contain"
                                />
                              </Press>
                            ) : (
                              <Press
                                accessibilityRole="button"
                                accessibilityLabel={`Open ${file.name}`}
                                accessibilityHint="Opens a local document preview"
                                onPress={() => {
                                  if (
                                    file.mimeType === "application/pdf" &&
                                    Platform.OS === "ios"
                                  )
                                    void action(() => openPdfPreview(file));
                                  else setPreviewFile(file);
                                }}
                                style={[s.card, { gap: 6 }]}
                              >
                                <Text style={[s.text, { fontWeight: "600" }]}>
                                  {file.name}
                                </Text>
                                <Text style={s.sub}>
                                  {file.mimeType === "application/pdf"
                                    ? "PDF document"
                                    : "Text document"}{" "}
                                  · {Math.max(1, Math.ceil(file.size / 1024))}{" "}
                                  KB · Tap to open
                                </Text>
                              </Press>
                            )}
                            <Button
                              title={
                                file.mimeType.startsWith("image/")
                                  ? "Save or share image"
                                  : file.mimeType === "application/pdf"
                                    ? "Save or share PDF"
                                    : "Save or share text file"
                              }
                              secondary
                              icon="share-outline"
                              onPress={() =>
                                void action(() => shareGeneratedFile(file))
                              }
                            />
                          </View>
                        ))}
                        {message.text ? (
                          <>
                            <MessageContent
                              text={message.text}
                              sources={message.sources}
                            />
                            {message.status === "streaming" ? (
                              <StreamCaret />
                            ) : null}
                          </>
                        ) : message.status === "streaming" ? (
                          <FadeIn distance={6} duration={200}>
                            <View
                              accessible
                              accessibilityLabel={progressLabel}
                              accessibilityLiveRegion="polite"
                              style={[
                                s.row,
                                {
                                  alignSelf: "flex-start",
                                  gap: 10,
                                  paddingHorizontal: 14,
                                  paddingVertical: 10,
                                  borderRadius: 18,
                                  borderTopLeftRadius: 6,
                                  backgroundColor: theme.card,
                                  borderWidth: 1,
                                  borderColor: theme.hairline,
                                  boxShadow: theme.cardShadow,
                                },
                              ]}
                            >
                              <ThinkingOrb size={20} />
                              <Breathe>
                                <Text style={[s.sub, { fontSize: 13 }]}>
                                  {progressLabel}
                                </Text>
                              </Breathe>
                            </View>
                          </FadeIn>
                        ) : null}
                        {message.sources?.length ? (
                          <MessageSources sources={message.sources} />
                        ) : null}
                        {message.error ? (
                          <View
                            style={{
                              backgroundColor: theme.errorSurface,
                              padding: 13,
                              borderRadius: 11,
                              gap: 8,
                            }}
                          >
                            <Text style={s.error}>{message.error}</Text>
                            {index === conversation.messages.length - 1 ? (
                              <Button
                                title={
                                  hasSavedFilesInTurn
                                    ? "Retry text reply (keep files)"
                                    : "Retry response"
                                }
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
                            <PopIn trigger={copied === message.id}>
                              <IconButton
                                name={
                                  copied === message.id
                                    ? "checkmark-circle"
                                    : "copy-outline"
                                }
                                color={
                                  copied === message.id
                                    ? theme.green
                                    : undefined
                                }
                                label="Copy response"
                                onPress={() =>
                                  void action(async () => {
                                    await Clipboard.setStringAsync(
                                      message.text,
                                    );
                                    haptic.success();
                                    setCopied(message.id);
                                    setTimeout(() => setCopied(null), 1500);
                                  })
                                }
                              />
                            </PopIn>
                            <IconButton
                              name="document-text-outline"
                              label="Save response as text"
                              onPress={() =>
                                void action(() =>
                                  exportResponse(message.text, "txt"),
                                )
                              }
                            />
                            <IconButton
                              name="document-outline"
                              label="Save response as PDF"
                              onPress={() =>
                                void action(() =>
                                  exportResponse(message.text, "pdf"),
                                )
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
                  </FadeIn>
                ))}
              </>
            )}
          </ScrollView>
          <View style={{ paddingBottom: 8, gap: 10 }}>
            {needsPdfConnection ? (
              <View style={{ gap: 2 }}>
                <Text
                  accessibilityRole="alert"
                  style={[s.sub, { color: theme.error }]}
                >
                  {historyHasPdf
                    ? "This chat’s PDF needs a supported API format."
                    : "This API format doesn’t support PDFs."}
                </Text>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel="Choose PDF connection"
                  onPress={openModelPicker}
                  style={[
                    s.row,
                    { minHeight: 44, gap: 6, alignSelf: "flex-start" },
                  ]}
                >
                  <Text style={[s.text, { fontWeight: "600" }]}>
                    Choose PDF connection
                  </Text>
                  <Icon name="chevron-forward" size={16} />
                </Press>
              </View>
            ) : error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            {attachments.length ? (
              <ScrollView
                horizontal
                keyboardShouldPersistTaps="always"
                style={{ flexGrow: 0 }}
                contentContainerStyle={{
                  gap: 12,
                  alignItems: "center",
                  paddingVertical: 4,
                }}
              >
                {attachments.map((file) => {
                  const image = file.mimeType.startsWith("image/");
                  return (
                    <View
                      key={file.id}
                      style={{
                        padding: image ? 10 : 12,
                        gap: 8,
                        boxShadow: theme.cardShadow,
                        width: image ? 144 : 176,
                        minHeight: image ? 165 : 134,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.fileLine,
                        backgroundColor: theme.file,
                      }}
                    >
                      {image ? (
                        <Press
                          accessibilityRole="button"
                          accessibilityLabel={`Preview ${file.name}`}
                          accessibilityHint="Opens a local image preview"
                          onPress={() => {
                            Keyboard.dismiss();
                            setPreviewFile(file);
                          }}
                        >
                          <Image
                            source={{ uri: attachmentUri(file) }}
                            accessibilityLabel={`Preview ${file.name}`}
                            style={{ width: 122, height: 96, borderRadius: 8 }}
                            resizeMode="cover"
                          />
                          <Text
                            style={{
                              position: "absolute",
                              bottom: 6,
                              left: 6,
                              backgroundColor: "#00000066",
                              color: "#FFF",
                              borderRadius: 4,
                              paddingHorizontal: 5,
                              paddingVertical: 3,
                              fontSize: 10,
                            }}
                          >
                            {file.mimeType.split("/")[1]?.toUpperCase()}
                          </Text>
                        </Press>
                      ) : (
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            backgroundColor: theme.muted,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 18,
                            borderWidth: 1,
                            borderColor: theme.hairline,
                          }}
                        >
                          <Icon
                            name="document-text-outline"
                            design="fileDocument"
                            size={18}
                            color={theme.ink}
                          />
                        </View>
                      )}
                      <View style={{ paddingRight: image ? 30 : 0 }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            color: theme.ink,
                            fontSize: 12,
                            lineHeight: 16,
                            fontWeight: image ? "400" : "500",
                          }}
                        >
                          {file.name}
                        </Text>
                        <Text
                          style={{
                            color: theme.quiet,
                            fontSize: 11,
                            lineHeight: 16,
                          }}
                        >
                          {Math.ceil(file.size / 1024)} KB
                          {!image && file.mimeType.startsWith("text/")
                            ? " · Plain text"
                            : ""}
                        </Text>
                      </View>
                      <View
                        style={{
                          position: "absolute",
                          right: 0,
                          ...(image ? { bottom: 4 } : { top: 0 }),
                        }}
                      >
                        <IconButton
                          name="close"
                          design="removeFile"
                          size={14}
                          label={`Remove ${file.name}`}
                          onPress={() => removeAttachment(file.id)}
                        />
                      </View>
                    </View>
                  );
                })}
                {attachments.length < 4 ? (
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel="Add file"
                    disabled={picking || submitting || !!runningId}
                    onPress={() => {
                      composer.current?.blur();
                      Keyboard.dismiss();
                      dispatchAttachment({ type: "open" });
                    }}
                    style={({ pressed }) => ({
                      width: 112,
                      minHeight: 134,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor: theme.lineStrong,
                      backgroundColor: theme.surface,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity:
                        picking || submitting || runningId
                          ? 0.4
                          : pressed
                            ? 0.6
                            : 1,
                    })}
                  >
                    <Icon name="add" design="addFile" />
                    <Text
                      style={{
                        fontSize: 11,
                        lineHeight: 16.5,
                        color: theme.quiet,
                      }}
                    >
                      Add file
                    </Text>
                  </Press>
                ) : null}
              </ScrollView>
            ) : null}
            {picking ? (
              <Text accessibilityLiveRegion="polite" style={s.sub}>
                {attachmentPreparation === "reading"
                  ? "Reading attachment…"
                  : attachmentPreparation === "encoding"
                    ? "Finishing photo…"
                    : attachmentPreparation === "decoding"
                      ? "Preparing photo…"
                      : attachmentPreparation === "opening"
                        ? "Opening photo…"
                        : attachmentPreparation === "inspecting"
                          ? "Checking attachment…"
                          : "Choosing attachment…"}
              </Text>
            ) : null}
            <View style={s.between}>
              <Press
                feel="tick"
                accessibilityRole="button"
                accessibilityLabel={`Choose model connection${connection ? `. ${connection.name}, ${connection.model}` : ""}`}
                onPress={openModelPicker}
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
                  style={{ fontSize: 12, color: theme.quiet, flexShrink: 1 }}
                >
                  {connection ? `${connection.model}` : "Choose a model"}
                </Text>
                <Icon
                  name="chevron-down"
                  design="down"
                  size={12}
                  color={theme.sub}
                />
              </Press>
            </View>
            <View
              style={[
                s.row,
                {
                  alignItems: "flex-end",
                  gap: 10,
                  padding: 4,
                  boxShadow: composerFocused
                    ? `0px 0px 0px 4px ${rgba(theme.primary, 0.14)}, 0px 8px 24px -8px ${rgba(theme.accent2, 0.35)}`
                    : theme.cardShadow,
                  borderRadius: 27,
                  borderWidth: 1,
                  borderColor: composerFocused ? theme.primary : theme.fileLine,
                  backgroundColor: theme.file,
                },
              ]}
            >
              <IconButton
                name="add"
                design="add"
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
                placeholderTextColor={theme.quiet}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 20,
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
              <View
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Burst count={sentCount} color={theme.accent2} size={40} />
                {isRunning ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PulseRing color={theme.primary} size={44} />
                    <Tappable
                      accessibilityRole="button"
                      accessibilityLabel="Stop response"
                      onPress={() => {
                        haptic.stop();
                        stop();
                      }}
                      scaleTo={0.86}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        ...accentGradient(),
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="stop" size={16} color={theme.onPrimary} />
                    </Tappable>
                  </View>
                ) : (
                  <Tappable
                    accessibilityRole="button"
                    accessibilityLabel="Send message"
                    scaleTo={0.82}
                    disabled={
                      (!text.trim() && !attachments.length) ||
                      !!runningId ||
                      submitting ||
                      picking
                    }
                    onPress={() => {
                      haptic.send();
                      setSentCount((n) => n + 1);
                      void submit();
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PopIn
                      trigger={canSend}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: canSend
                          ? theme.primary
                          : theme.disabled,
                        ...(canSend ? accentGradient() : {}),
                        ...(canSend ? { boxShadow: theme.raisedShadow } : {}),
                      }}
                    >
                      <Icon
                        name="arrow-up"
                        design={canSend ? "send" : undefined}
                        size={20}
                        color={canSend ? theme.onPrimary : theme.disabledText}
                      />
                    </PopIn>
                  </Tappable>
                )}
              </View>
            </View>
            {runningId ? (
              <Text
                style={{ textAlign: "center", fontSize: 12, color: theme.sub }}
              >
                {runningId && !isRunning
                  ? "Another conversation is responding."
                  : isRunning
                    ? `${progressLabel}. ${responseProgress?.backgroundAllowed ? "Can continue briefly in background; iOS may pause it." : "Keep Nylo open for this request."}`
                    : "Saved on this device. AI can make mistakes."}
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </BlurTargetView>
      <DocumentPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onError={(e) =>
          setError(
            e instanceof Error ? e.message : "Could not share this file.",
          )
        }
      />
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
            backgroundColor: "transparent",
          }}
        >
          <BlurView
            pointerEvents="none"
            blurTarget={blurTarget}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={8}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: theme.attachmentOverlay,
            }}
          />
          <View
            accessibilityViewIsModal
            style={{
              maxHeight: "85%",
              padding: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              gap: 12,
              backgroundColor: theme.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: theme.line,
            }}
          >
            <View
              accessible={false}
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.line,
                marginTop: -4,
                marginBottom: 4,
              }}
            />
            <ScrollView
              style={{ flexGrow: 0, flexShrink: 1 }}
              contentContainerStyle={{ gap: 10 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text
                accessibilityRole="header"
                style={[
                  s.h2,
                  {
                    fontWeight: "700",
                    letterSpacing: -0.45,
                    paddingHorizontal: 4,
                    lineHeight: 24,
                    marginBottom: 10,
                  },
                ]}
              >
                Attachments
              </Text>
              <Button
                title="Photo library"
                style={{
                  minHeight: 52,
                  borderRadius: 26,
                  gap: 12,
                  boxShadow: theme.cardShadow,
                }}
                secondary
                icon="images-outline"
                designIcon="photos"
                onPress={() => queueAttachment("photos")}
              />
              <Button
                title="Take a photo"
                style={{
                  minHeight: 52,
                  borderRadius: 26,
                  gap: 12,
                  boxShadow: theme.cardShadow,
                }}
                secondary
                icon="camera-outline"
                designIcon="camera"
                onPress={() => queueAttachment("camera")}
              />
              <Button
                title="Choose files"
                style={{
                  minHeight: 52,
                  borderRadius: 26,
                  gap: 12,
                  boxShadow: theme.cardShadow,
                }}
                secondary
                icon="document-outline"
                designIcon="files"
                onPress={() => queueAttachment("files")}
              />
              <Text
                style={[
                  s.sub,
                  {
                    color: theme.quiet,
                    fontSize: 12,
                    lineHeight: 19.5,
                    paddingHorizontal: 12,
                    marginTop: 6,
                    marginBottom: 8,
                  },
                ]}
              >
                Up to 4 files · 2 MB each, 4 MB total. Stored here until sent to
                your provider.
              </Text>
            </ScrollView>
            <Button
              title="Cancel attachments"
              style={{ minHeight: 50, backgroundColor: theme.muted }}
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
            backgroundColor: "transparent",
          }}
        >
          {!hasPdf ? (
            <BlurView
              pointerEvents="none"
              blurTarget={blurTarget}
              blurMethod="dimezisBlurViewSdk31Plus"
              intensity={12}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: hasPdf
                ? scheme === "dark"
                  ? theme.overlay
                  : "rgba(165,164,162,0.8)"
                : theme.overlay,
            }}
          />
          <Press
            feel="none"
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
              padding: hasPdf ? 20 : 24,
              paddingBottom: Math.max(insets.bottom, 16),
              gap: 12,
              backgroundColor: hasPdf ? theme.bg : theme.card,
              borderTopLeftRadius: hasPdf ? 32 : 28,
              borderTopRightRadius: hasPdf ? 32 : 28,
              borderTopWidth: 1,
              borderColor: hasPdf ? theme.hairline : theme.line,
            }}
          >
            <View
              accessible={false}
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: hasPdf ? theme.lineStrong : theme.line,
                marginTop: hasPdf ? -8 : -14,
              }}
            />
            <View style={s.between}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.6}
                style={[
                  s.h2,
                  {
                    fontSize: 22,
                    fontWeight: "700",
                    color: hasPdf ? theme.ink : theme.text,
                    letterSpacing: -0.55,
                  },
                ]}
              >
                Choose a model
              </Text>
              <IconButton
                name="close"
                design="close"
                label="Close model picker"
                onPress={() => setModelPicker(false)}
              />
            </View>
            {hasPdf ? (
              <Text style={[s.sub, { fontSize: 12, lineHeight: 18 }]}>
                PDFs need Responses or Claude Messages. The selected model must
                also support PDF input. Choosing a connection sends nothing.
              </Text>
            ) : null}
            <View
              style={[
                s.row,
                {
                  gap: 8,
                  paddingHorizontal: 12,
                  borderRadius: hasPdf ? 22 : 12,
                  borderWidth: 1,
                  borderColor: hasPdf ? theme.line : theme.line,
                  backgroundColor: theme.surface,
                  marginHorizontal: hasPdf ? 0 : -4,
                },
              ]}
            >
              <Icon name="search" design="search" size={18} color={theme.sub} />
              <TextInput
                testID="chat-model-search"
                accessibilityLabel="Search models"
                placeholder="Search models or providers"
                placeholderTextColor={theme.sub}
                value={modelSearch}
                onChangeText={setModelSearch}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
                style={{
                  flex: 1,
                  minHeight: hasPdf ? 44 : 48,
                  paddingVertical: 10,
                  color: theme.ink,
                  fontSize: 14,
                }}
              />
            </View>
            <SectionList
              sections={modelSections(data.connections, modelSearch)}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              stickySectionHeadersEnabled={false}
              style={{
                flexGrow: 0,
                flexShrink: 1,
                marginHorizontal: hasPdf ? 0 : -4,
              }}
              renderSectionHeader={({ section: { connection: c } }) => (
                <View
                  style={{
                    paddingTop: 16,
                    paddingBottom: 4,
                    paddingHorizontal: hasPdf ? 0 : 4,
                    gap: 4,
                  }}
                >
                  <Text
                    accessibilityRole="header"
                    style={[
                      s.sub,
                      {
                        fontSize: 12,
                        fontWeight: hasPdf ? "600" : "500",
                        color: hasPdf ? theme.text : theme.quiet,
                        textTransform: hasPdf ? "none" : "uppercase",
                        letterSpacing: hasPdf ? 0.24 : 0.6,
                      },
                    ]}
                  >
                    {c.name}
                  </Text>
                  {hasPdf ? (
                    <Text style={[s.sub, { fontSize: 12 }]}>
                      {c.protocol === "compatible"
                        ? "Chat Completions · PDFs unavailable"
                        : c.protocol === "openai"
                          ? "Responses"
                          : "Claude Messages"}
                    </Text>
                  ) : null}
                  {hasPdf && c.protocol === "compatible" ? (
                    <Press
                      accessibilityRole="button"
                      accessibilityLabel={`Edit API format for ${c.name}`}
                      disabled={!!runningId}
                      onPress={() => {
                        setModelPicker(false);
                        router.push({
                          pathname: "/connection",
                          params: { id: c.id, purpose: "pdf" },
                        });
                      }}
                      style={[s.row, { minHeight: 44, gap: 6 }]}
                    >
                      <Text
                        style={[s.sub, { color: theme.ink, fontWeight: "600" }]}
                      >
                        Edit API format
                      </Text>
                      <Icon name="chevron-forward" design="pdfEdit" size={14} />
                    </Press>
                  ) : null}
                </View>
              )}
              renderItem={({
                item: { id: choiceId, model },
                section: { connection: c },
              }) => (
                <Press
                  key={choiceId}
                  accessibilityRole="radio"
                  accessibilityLabel={`${c.name}. ${model}${hasPdf && c.protocol === "compatible" ? ". PDFs unavailable with Chat Completions" : ""}`}
                  accessibilityState={{
                    checked:
                      c.id === connection?.id && model === connection.model,
                    disabled:
                      !!runningId || (hasPdf && c.protocol === "compatible"),
                  }}
                  disabled={
                    !!runningId || (hasPdf && c.protocol === "compatible")
                  }
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
                  style={({ pressed }) => [
                    s.row,
                    {
                      minHeight: hasPdf
                        ? c.protocol === "compatible"
                          ? 46
                          : 62
                        : 54,
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      marginVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor:
                        hasPdf && c.protocol === "compatible"
                          ? theme.hairline
                          : c.id === connection?.id &&
                              model === connection.model
                            ? hasPdf
                              ? theme.lineStrong
                              : theme.line
                            : "transparent",
                      backgroundColor:
                        hasPdf && c.protocol === "compatible"
                          ? theme.muted
                          : c.id === connection?.id &&
                              model === connection.model
                            ? hasPdf
                              ? theme.card
                              : theme.surface
                            : pressed
                              ? theme.pale
                              : "transparent",
                      opacity: hasPdf && c.protocol === "compatible" ? 0.45 : 1,
                    },
                  ]}
                >
                  {hasPdf ? (
                    <Icon
                      name="hardware-chip-outline"
                      design={
                        c.protocol === "compatible"
                          ? "pdfRobotDisabled"
                          : "pdfRobot"
                      }
                    />
                  ) : null}
                  <Text
                    style={[
                      s.text,
                      {
                        flex: 1,
                        fontFamily: hasPdf ? fonts.body : fonts.heading,
                        fontSize: hasPdf ? 14 : 16,
                        lineHeight: hasPdf ? 20 : 24,
                        color: hasPdf
                          ? c.protocol === "compatible"
                            ? theme.quiet
                            : theme.ink
                          : theme.text,
                        letterSpacing: hasPdf ? 0 : -0.08,
                        fontWeight:
                          hasPdf && c.protocol === "compatible"
                            ? "500"
                            : c.id === connection?.id &&
                                model === connection.model
                              ? "600"
                              : hasPdf
                                ? "400"
                                : "500",
                      },
                    ]}
                  >
                    {model}
                  </Text>
                  {c.id === connection?.id && model === connection.model ? (
                    hasPdf && c.protocol !== "compatible" ? (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: theme.selected,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon
                          name="checkmark"
                          design="pdfCheck"
                          size={16}
                          color={theme.ink}
                        />
                      </View>
                    ) : (
                      <Icon
                        name="checkmark"
                        design="modelCheck"
                        size={hasPdf ? 18 : 20}
                        color={
                          hasPdf ? "rgba(118, 118, 128, 0.5)" : theme.primary
                        }
                      />
                    )
                  ) : null}
                </Press>
              )}
              ListEmptyComponent={
                <Text style={[s.sub, { paddingVertical: 20 }]}>
                  No models found. Try another search or manage your providers.
                </Text>
              }
            />
            <View style={{ paddingTop: 16, gap: 12 }}>
              <Text
                style={[
                  s.sub,
                  {
                    fontSize: 12,
                    lineHeight: 18,
                    paddingHorizontal: hasPdf ? 0 : 4,
                  },
                ]}
              >
                Switching models sends nothing. Your next message includes this
                chat’s context.
              </Text>
              <Button
                title="Manage providers"
                style={{
                  minHeight: hasPdf ? 46 : 52,
                  borderRadius: hasPdf ? 23 : 26,
                  backgroundColor: hasPdf ? theme.surface : theme.line,
                  borderColor: hasPdf ? theme.lineStrong : theme.line,
                }}
                textStyle={{
                  color: hasPdf ? theme.ink : theme.text,
                  fontFamily: hasPdf ? fonts.heading : fonts.body,
                  letterSpacing: hasPdf ? 0 : 0.14,
                }}
                secondary
                onPress={() => {
                  setModelPicker(false);
                  router.push("/connection");
                }}
              />
            </View>
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
            backgroundColor: theme.overlay,
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
