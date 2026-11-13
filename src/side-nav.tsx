import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "./typography";
import { useStore } from "./store";
import { AgentCharacter } from "./agent-character";
import { isDeviceCheckConversation, plainTextPreview } from "./domain";
import { Agent, Conversation } from "./types";
import {
  BrandMark,
  Icon,
  IconBubble,
  Tappable,
  ThinkingOrb,
  accentGradient,
  confirm,
  haptic,
  relativeDay,
  rgba,
  s,
  theme,
} from "./ui";
import { smooth, useReducedMotion } from "./motion";

type Kind = "all" | "chat" | "agent";

/** Today / Yesterday / Previous 7 days / Earlier. */
export function historyGroup(timestamp: number, now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const today = start.getTime();
  if (timestamp >= today) return "Today";
  if (timestamp >= today - 86400000) return "Yesterday";
  if (timestamp >= today - 7 * 86400000) return "Previous 7 days";
  return "Earlier";
}

/** Saved conversations for the history list, newest first. */
export function historyChats(
  data: ReturnType<typeof useStore>["data"],
  {
    query,
    archived,
    kind,
    exclude,
  }: { query: string; archived: boolean; kind: Kind; exclude?: string },
) {
  const needle = query.trim().toLocaleLowerCase();
  return data.conversations
    .filter((c) => c.id !== exclude && !isDeviceCheckConversation(data, c.id))
    .filter((c) => !!c.archived === archived)
    .filter(
      (c) =>
        c.archived ||
        c.messages.length > 0 ||
        !!c.draft?.trim() ||
        !!c.draftAttachments?.length,
    )
    .filter((c) =>
      kind === "all" ? true : kind === "agent" ? !!c.agentId : !c.agentId,
    )
    .filter((c) => {
      if (!needle) return true;
      const agent = data.agents.find((a) => a.id === c.agentId);
      return (
        `${c.title} ${c.draft || ""} ${agent?.name || ""}`
          .toLocaleLowerCase()
          .includes(needle) ||
        c.messages.some((m) => m.text.toLocaleLowerCase().includes(needle))
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function SideNav({
  visible,
  onClose,
  onNewChat,
  onOpen,
  exclude,
}: {
  visible: boolean;
  onClose: () => void;
  /** Start a fresh chat on the home tab. */
  onNewChat: () => void;
  /** Open a chat in place (the home screen); otherwise it is pushed. */
  onOpen?: (chat: Conversation) => void;
  /** The home tab's own blank chat; never listed as history. */
  exclude?: string;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { data, runningIds, archiveChat, deleteChat } = useStore();
  const panelWidth = Math.min(340, width * 0.86);
  const slide = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [archived, setArchived] = useState(false);
  const [menuFor, setMenuFor] = useState<Conversation | null>(null);
  const [error, setError] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : visible ? 320 : 240,
      easing: smooth,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        setMenuFor(null);
        setError("");
      }
    });
  }, [visible, reduced]);
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (menuFor) setMenuFor(null);
      else onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, menuFor, onClose]);

  const chats = useMemo(
    () => historyChats(data, { query, archived, kind, exclude }),
    [data, query, archived, kind, exclude],
  );
  const archivedCount = useMemo(
    () =>
      historyChats(data, { query: "", archived: true, kind: "all", exclude })
        .length,
    [data, exclude],
  );
  const groups = useMemo(() => {
    const out: { title: string; items: Conversation[] }[] = [];
    for (const chat of chats) {
      const title = archived ? "Archived" : historyGroup(chat.updatedAt);
      const last = out.at(-1);
      if (last?.title === title) last.items.push(chat);
      else out.push({ title, items: [chat] });
    }
    return out;
  }, [chats, archived]);
  const agentFor = (c: Conversation) =>
    data.agents.find((a) => a.id === c.agentId);

  const go = (fn: () => void) => {
    onClose();
    fn();
  };
  const runAction = async (chat: Conversation, remove: boolean) => {
    setMenuFor(null);
    setError("");
    try {
      if (remove) {
        if (
          !(await confirm(
            "Delete chat?",
            `“${chat.title}” and its messages and attachments will be removed from this device. This cannot be undone. Saved agent memories are kept.`,
          ))
        )
          return;
        await deleteChat(chat.id);
      } else {
        await archiveChat(chat.id, !chat.archived);
        haptic.select();
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!mounted) return null;
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(8,10,20,0.42)",
          opacity: slide,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: panelWidth,
          backgroundColor: theme.bg,
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          boxShadow: "8px 0px 32px rgba(0,0,0,0.18)",
          transform: [
            {
              translateX: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [-panelWidth - 24, 0],
              }),
            },
          ],
        }}
      >
        {/* Brand + close */}
        <View style={[s.between, { paddingHorizontal: 18, minHeight: 48 }]}>
          <BrandMark height={20} />
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={onClose}
            feel="tick"
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={22} color={theme.sub} />
          </Tappable>
        </View>

        {/* New chat */}
        <View style={{ paddingHorizontal: 14, gap: 10, marginTop: 4 }}>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="New chat"
            onPress={() => go(onNewChat)}
            feel="card"
            scaleTo={0.97}
            style={[
              s.row,
              {
                gap: 10,
                minHeight: 48,
                paddingHorizontal: 16,
                borderRadius: 16,
                ...accentGradient(),
              },
            ]}
          >
            <Icon name="create-outline" size={19} color={theme.onPrimary} />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: theme.onPrimary,
              }}
            >
              New chat
            </Text>
          </Tappable>

          {/* Search */}
          <View
            style={[
              s.row,
              {
                backgroundColor: theme.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: searchFocused ? theme.primary : theme.line,
                paddingHorizontal: 12,
                gap: 8,
              },
            ]}
          >
            <Icon
              name="search-outline"
              color={searchFocused ? theme.accentText : theme.quiet}
              size={18}
            />
            <TextInput
              accessibilityLabel="Search history"
              placeholder="Search history"
              placeholderTextColor={theme.quiet}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              clearButtonMode="while-editing"
              returnKeyType="search"
              style={{
                flex: 1,
                minHeight: 44,
                fontSize: 15,
                color: theme.ink,
                paddingVertical: 8,
              }}
            />
          </View>

          {/* Kind filter */}
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Show"
            style={[s.row, { gap: 8 }]}
          >
            {(
              [
                ["all", "All", "albums-outline"],
                ["chat", "Chats", "chatbubble-outline"],
                ["agent", "Agents", "sparkles-outline"],
              ] as const
            ).map(([value, label, icon]) => {
              const selected = kind === value;
              return (
                <Tappable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, checked: selected }}
                  accessibilityLabel={label}
                  onPress={() => setKind(value)}
                  scaleTo={0.94}
                  style={[
                    s.row,
                    {
                      gap: 5,
                      minHeight: 34,
                      paddingHorizontal: 12,
                      borderRadius: 17,
                      backgroundColor: selected ? theme.pale : theme.card,
                      borderWidth: 1,
                      borderColor: selected
                        ? rgba(theme.primary, 0.35)
                        : theme.hairline,
                    },
                  ]}
                >
                  <Icon
                    name={icon}
                    size={14}
                    color={selected ? theme.accentText : theme.quiet}
                  />
                  <Text
                    maxFontSizeMultiplier={1.4}
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: selected ? theme.accentText : theme.sub,
                    }}
                  >
                    {label}
                  </Text>
                </Tappable>
              );
            })}
          </View>
        </View>

        {error ? (
          <Text
            accessibilityRole="alert"
            style={[s.error, { paddingHorizontal: 18, marginTop: 8 }]}
          >
            {error}
          </Text>
        ) : null}

        {/* History */}
        <ScrollView
          style={{ flex: 1, marginTop: 8 }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {archived ? (
            <Tappable
              accessibilityRole="button"
              accessibilityLabel="Back to history"
              onPress={() => setArchived(false)}
              style={[s.row, { gap: 8, minHeight: 44, paddingHorizontal: 10 }]}
            >
              <Icon name="arrow-back" size={17} color={theme.accentText} />
              <Text style={[s.sub, { color: theme.accentText }]}>
                Back to history
              </Text>
            </Tappable>
          ) : null}
          {groups.map((group) => (
            <View key={group.title} style={{ marginTop: 10 }}>
              <Text
                accessibilityRole="header"
                style={[s.eyebrow, { paddingHorizontal: 10, marginBottom: 4 }]}
              >
                {group.title}
              </Text>
              {group.items.map((chat) => (
                <HistoryRow
                  key={chat.id}
                  chat={chat}
                  agent={agentFor(chat)}
                  live={runningIds.includes(chat.id)}
                  onOpen={() =>
                    go(() =>
                      onOpen
                        ? onOpen(chat)
                        : router.push({
                            pathname: "/chat/[id]",
                            params: { id: chat.id },
                          }),
                    )
                  }
                  onMenu={() => {
                    haptic.select();
                    setMenuFor(chat);
                  }}
                />
              ))}
            </View>
          ))}
          {!groups.length ? (
            <View style={{ alignItems: "center", padding: 28, gap: 8 }}>
              <IconBubble
                name={query ? "search-outline" : "time-outline"}
                size={44}
              />
              <Text style={[s.text, { fontWeight: "600" }]}>
                {query
                  ? "Nothing found"
                  : archived
                    ? "No archived chats"
                    : "No history yet"}
              </Text>
              <Text style={[s.sub, { textAlign: "center" }]}>
                {query
                  ? "Try another word or an agent’s name."
                  : archived
                    ? "Archived chats wait here until you restore them."
                    : "Your chats and agent sessions appear here."}
              </Text>
            </View>
          ) : null}
          {!archived && archivedCount ? (
            <Tappable
              accessibilityRole="button"
              accessibilityLabel={`Archived chats, ${archivedCount}`}
              onPress={() => {
                setArchived(true);
                setQuery("");
              }}
              style={[
                s.row,
                { gap: 10, minHeight: 44, paddingHorizontal: 10, marginTop: 8 },
              ]}
            >
              <Icon name="archive-outline" size={18} color={theme.sub} />
              <Text style={[s.sub, { flex: 1 }]}>Archived</Text>
              <Text style={[s.sub, { color: theme.quiet }]}>
                {archivedCount}
              </Text>
            </Tappable>
          ) : null}
        </ScrollView>

        {/* Profile + settings */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.hairline,
            paddingTop: 10,
            paddingHorizontal: 14,
            gap: 4,
          }}
        >
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Agents"
            onPress={() => go(() => router.push("/agents"))}
            style={[s.row, { gap: 12, minHeight: 44, paddingHorizontal: 4 }]}
          >
            <Icon name="people-outline" size={20} color={theme.sub} />
            <Text style={[s.text, { flex: 1 }]}>Manage agents</Text>
            <Icon name="chevron-forward" size={14} color={theme.quiet} />
          </Tappable>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => go(() => router.push("/settings"))}
            feel="card"
            scaleTo={0.98}
            style={[
              s.row,
              {
                gap: 12,
                minHeight: 56,
                paddingHorizontal: 10,
                borderRadius: 18,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.hairline,
              },
            ]}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                ...accentGradient(),
              }}
            >
              <Icon name="person" size={18} color={theme.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.text, { fontWeight: "600" }]}>You</Text>
              <Text style={[s.sub, { fontSize: 12 }]}>
                {data.connections.length
                  ? `${data.connections.length} provider${data.connections.length === 1 ? "" : "s"} connected`
                  : "No provider connected"}
              </Text>
            </View>
            <Icon name="settings-outline" size={20} color={theme.sub} />
          </Tappable>
        </View>

        {/* Row actions */}
        {menuFor ? (
          <View
            style={{
              position: "absolute",
              inset: 0,
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chat actions"
              onPress={() => setMenuFor(null)}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(8,10,20,0.25)",
                borderTopRightRadius: 28,
                borderBottomRightRadius: 28,
              }}
            />
            <View
              style={{
                margin: 12,
                marginBottom: insets.bottom + 12,
                padding: 8,
                borderRadius: 22,
                backgroundColor: theme.card,
                boxShadow: theme.raisedShadow,
              }}
            >
              <Text
                numberOfLines={1}
                style={[s.sub, { paddingHorizontal: 12, paddingVertical: 8 }]}
              >
                {menuFor.title}
              </Text>
              {[
                {
                  remove: false,
                  label: menuFor.archived ? "Restore" : "Archive",
                  icon: menuFor.archived
                    ? ("arrow-undo-outline" as const)
                    : ("archive-outline" as const),
                },
                {
                  remove: true,
                  label: "Delete",
                  icon: "trash-outline" as const,
                },
              ].map((item) => (
                <Tappable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label} ${menuFor.title}`}
                  onPress={() => void runAction(menuFor, item.remove)}
                  style={[
                    s.row,
                    {
                      gap: 12,
                      minHeight: 48,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    color={item.remove ? theme.error : theme.ink}
                  />
                  <Text
                    style={[
                      s.text,
                      {
                        fontWeight: "600",
                        color: item.remove ? theme.error : theme.ink,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Tappable>
              ))}
            </View>
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

function HistoryRow({
  chat,
  agent,
  live,
  onOpen,
  onMenu,
}: {
  chat: Conversation;
  agent?: Agent;
  live: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const last = chat.messages.filter((m) => m.text).at(-1);
  const preview = chat.draft?.trim()
    ? `Draft: ${plainTextPreview(chat.draft)}`
    : plainTextPreview(last?.text || "");
  return (
    <View style={[s.row, { borderRadius: 16 }]}>
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={[
          `Open ${chat.title}`,
          agent ? `Agent session with ${agent.name}` : "Chat",
          live ? "Replying" : relativeDay(chat.updatedAt),
        ].join(". ")}
        accessibilityHint="Long press for archive and delete."
        accessibilityActions={[{ name: "longpress", label: "Chat actions" }]}
        onAccessibilityAction={onMenu}
        onPress={onOpen}
        onLongPress={onMenu}
        feel="card"
        scaleTo={0.98}
        ripple={rgba(agent?.color || theme.primary, 0.35)}
        style={[
          s.row,
          {
            flex: 1,
            gap: 12,
            minHeight: 56,
            paddingVertical: 8,
            paddingLeft: 10,
            borderRadius: 16,
          },
        ]}
      >
        {agent ? (
          <AgentCharacter agent={agent} size={34} speaking={live} />
        ) : (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.pale,
            }}
          >
            <Icon
              name="chatbubble-ellipses-outline"
              size={17}
              color={theme.accentText}
            />
          </View>
        )}
        <View style={{ flex: 1, gap: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", color: theme.ink }}
          >
            {chat.title}
          </Text>
          <View style={[s.row, { gap: 6 }]}>
            {live ? (
              <>
                <ThinkingOrb size={10} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.accentText,
                  }}
                >
                  Replying…
                </Text>
              </>
            ) : (
              <Text
                numberOfLines={1}
                style={{ flex: 1, fontSize: 12, color: theme.quiet }}
              >
                {agent ? (
                  <Text style={{ color: agent.color, fontWeight: "600" }}>
                    {agent.name}
                    {preview ? " · " : ""}
                  </Text>
                ) : null}
                {preview}
              </Text>
            )}
          </View>
        </View>
      </Tappable>
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={`More actions for ${chat.title}`}
        onPress={onMenu}
        feel="tick"
        style={{
          width: 40,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="ellipsis-vertical" size={17} color={theme.quiet} />
      </Tappable>
    </View>
  );
}
