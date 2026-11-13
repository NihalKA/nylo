import { Text } from "../src/typography";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useStore } from "../src/store";
import { isDeviceCheckConversation } from "../src/domain";
import { Chat, ChatActivity } from "./chat/[id]";
import { SideNav } from "../src/side-nav";
import {
  AgentCharacter,
  AgentMood,
  agentPersona,
  moodLabel,
} from "../src/agent-character";
import { Agent, AppData, Conversation } from "../src/types";
import { glide, smooth, useReducedMotion } from "../src/motion";
import {
  BrandMark,
  Button,
  FadeIn,
  Icon,
  IconButton,
  Page,
  Segmented,
  Tappable,
  dayMood,
  haptic,
  rgba,
  s,
  theme,
  useTheme,
} from "../src/ui";

type Mode = "chat" | "agent";

const starters = [
  { label: "Help me write", prefix: "Help me write ", icon: "create-outline" },
  {
    label: "Think it through",
    prefix: "Help me think through ",
    icon: "bulb-outline",
  },
  { label: "Summarize", prefix: "Summarize this: ", icon: "reader-outline" },
  { label: "Plan my day", prefix: "Help me plan ", icon: "calendar-outline" },
] as const;

const agentTemplates = [
  {
    title: "Writing partner",
    body: "Drafts that sound like you",
    color: "#2F5BEA",
  },
  {
    title: "Thinking partner",
    body: "Room to work through an idea",
    color: "#C2650F",
  },
  {
    title: "Project guide",
    body: "Decisions and next steps together",
    color: "#1F8A4C",
  },
];

const usable = (data: AppData, c: Conversation) =>
  !isDeviceCheckConversation(data, c.id) && !c.archived;

/** Chat mode: resume an unsent draft, otherwise start fresh. */
function chatSession(data: AppData) {
  return data.conversations
    .filter((c) => usable(data, c) && !c.agentId && !c.messages.length)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

/** Agent mode: pick up the agent's latest session where it was left. */
function agentSession(data: AppData, agentId: string) {
  return data.conversations
    .filter((c) => usable(data, c) && c.agentId === agentId)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export default function Home() {
  useTheme();
  const reduced = useReducedMotion();
  const { data, newChat } = useStore();
  const [mode, setMode] = useState<Mode>("chat");
  const [navOpen, setNavOpen] = useState(false);
  const [activity, setActivity] = useState<ChatActivity>("idle");
  const agents = data.agents.filter((a) => a.id !== data.deviceCheck?.agentId);
  const [agentId, setAgentId] = useState<string | undefined>(agents[0]?.id);
  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const [error, setError] = useState("");

  // One open conversation per place: the chat, and each agent. Both the
  // chat and the current agent are prepared up front, so switching modes
  // never waits on (or flashes while) a conversation is created.
  const [sessions, setSessions] = useState<Record<string, string>>({});
  const find = (key?: string) =>
    key
      ? data.conversations.find(
          (c) => c.id === sessions[key] && usable(data, c),
        )
      : undefined;
  const chatConv = find("chat");
  const agentConv = find(agent?.id);
  const resolving = useRef(new Set<string>());
  useEffect(() => {
    for (const key of ["chat", agent?.id]) {
      if (!key || find(key) || resolving.current.has(key)) continue;
      const existing =
        key === "chat" ? chatSession(data) : agentSession(data, key);
      if (existing) {
        setSessions((m) => ({ ...m, [key]: existing.id }));
        continue;
      }
      resolving.current.add(key);
      newChat(key === "chat" ? undefined : key)
        .then((id) => setSessions((m) => ({ ...m, [key]: id })))
        .catch((e) => {
          setError((e as Error).message);
          fades[key === "chat" ? "chat" : "agent"].setValue(1);
        })
        .finally(() => resolving.current.delete(key));
    }
  }, [agent?.id, sessions, data.conversations]);

  // Mode: a single value crossfades and slides the two always-mounted
  // layers, and grows the agent strip, all in one motion.
  const modeAnim = useRef(new Animated.Value(0)).current;
  const strip = useRef(new Animated.Value(0)).current;
  const showStrip = mode === "agent" && agents.length > 0;
  useEffect(() => {
    const duration = reduced ? 0 : 300;
    const easing = smooth;
    Animated.parallel([
      Animated.timing(modeAnim, {
        toValue: mode === "agent" ? 1 : 0,
        duration,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(strip, {
        toValue: showStrip ? 1 : 0,
        duration,
        easing,
        useNativeDriver: false,
      }),
    ]).start();
  }, [mode, showStrip, reduced]);

  // Swapping the conversation inside a layer (another agent, a new
  // session): fade the old one out first, then fade the new one in once it
  // is ready. Nothing is ever painted at full strength before fading.
  const fades = {
    chat: useRef(new Animated.Value(1)).current,
    agent: useRef(new Animated.Value(1)).current,
  };
  const pending = useRef({ chat: false, agent: false });
  const swap = (layer: "chat" | "agent", change: () => void) => {
    if (reduced) return change();
    pending.current[layer] = true;
    Animated.timing(fades[layer], {
      toValue: 0,
      duration: glide.quick,
      easing: smooth,
      useNativeDriver: true,
    }).start(() => change());
  };
  const reveal = (layer: "chat" | "agent") => {
    if (!pending.current[layer]) return;
    pending.current[layer] = false;
    Animated.timing(fades[layer], {
      toValue: 1,
      duration: glide.base,
      easing: smooth,
      useNativeDriver: true,
    }).start();
  };
  useEffect(() => reveal("chat"), [chatConv?.id]);
  useEffect(() => {
    setActivity("idle");
    reveal("agent");
  }, [agentConv?.id]);

  useEffect(() => {
    if (agentId && !agents.some((a) => a.id === agentId))
      setAgentId(agents[0]?.id);
    else if (!agentId && agents[0]) setAgentId(agents[0].id);
  }, [agents.map((a) => a.id).join()]);
  useFocusEffect(useCallback(() => () => setNavOpen(false), []));

  const selectAgent = (next: Agent) => {
    if (next.id === agent?.id) return;
    haptic.select();
    swap("agent", () => setAgentId(next.id));
  };
  const startNew = (target: string) => {
    const layer = target === "chat" ? "chat" : "agent";
    swap(layer, () => {
      newChat(target === "chat" ? undefined : target)
        .then((id) => setSessions((m) => ({ ...m, [target]: id })))
        .catch((e) => {
          setError((e as Error).message);
          fades[layer].setValue(1);
        });
    });
  };
  const openChat = (chat: Conversation) => {
    if (chat.archived) {
      router.push({ pathname: "/chat/[id]", params: { id: chat.id } });
      return;
    }
    setSessions((m) => ({ ...m, [chat.agentId || "chat"]: chat.id }));
    if (chat.agentId) {
      setAgentId(chat.agentId);
      setMode("agent");
    } else setMode("chat");
  };
  const active = mode === "agent" ? agentConv : chatConv;
  const hasMessages = !!active?.messages.length;
  const activeKey = mode === "agent" ? agent?.id : "chat";

  const layer = (which: Mode) => {
    const on = mode === which;
    const shown =
      which === "chat"
        ? modeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          })
        : modeAnim;
    return {
      pointerEvents: on ? ("auto" as const) : ("none" as const),
      accessibilityElementsHidden: !on,
      importantForAccessibility: on
        ? ("auto" as const)
        : ("no-hide-descendants" as const),
      style: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: Animated.multiply(shown, fades[which]),
        transform: [
          {
            translateX: modeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: which === "chat" ? [0, -24] : [24, 0],
            }),
          },
        ],
      },
    };
  };

  return (
    <Page aura>
      {/* Top bar: stays put while the content below changes. */}
      <View style={[s.between, { minHeight: 56, marginHorizontal: -12 }]}>
        <Tappable
          accessibilityRole="button"
          accessibilityLabel="History: search, archive and delete chats"
          onPress={() => {
            haptic.select();
            setNavOpen(true);
          }}
          feel="tick"
          scaleTo={0.86}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HistoryGlyph />
        </Tappable>
        <View style={[s.row, { flex: 1, justifyContent: "center", gap: 8 }]}>
          <BrandMark height={16} />
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            maxFontSizeMultiplier={1.6}
            style={[s.h2, { fontSize: 20, letterSpacing: -0.5 }]}
          >
            Let’s begin
          </Text>
        </View>
        {hasMessages && activeKey ? (
          <IconButton
            name="create-outline"
            size={22}
            label={mode === "agent" ? "New session" : "New chat"}
            onPress={() => startNew(activeKey)}
          />
        ) : null}
        <IconButton
          name="settings-outline"
          design="tabSettings"
          tint={theme.ink}
          label="Settings"
          onPress={() => router.push("/settings")}
        />
      </View>
      <Segmented
        label="Chat or agent"
        value={mode}
        onChange={setMode}
        options={[
          { value: "chat", label: "Chat", icon: "chatbubble-ellipses-outline" },
          { value: "agent", label: "Agent", icon: "sparkles-outline" },
        ]}
      />
      <Animated.View
        style={{
          overflow: "hidden",
          height: strip.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 92],
          }),
          opacity: strip,
          marginHorizontal: -20,
        }}
      >
        {agent ? (
          <AgentSwitcher
            agents={agents}
            agent={agent}
            mood={mode === "agent" ? activity : "idle"}
            connected={!!data.connections.length}
            onSelect={selectAgent}
          />
        ) : null}
      </Animated.View>
      {error ? (
        <Text accessibilityRole="alert" style={[s.error, { marginTop: 8 }]}>
          {error}
        </Text>
      ) : null}
      {/* Both places stay mounted; only their visibility moves. */}
      <View style={{ flex: 1, marginTop: 6 }}>
        <Animated.View {...layer("chat")}>
          {chatConv ? (
            <Chat
              key={chatConv.id}
              chatId={chatConv.id}
              home={{
                renderIntro: ({ startDraft, connected }) => (
                  <ChatIntro connected={connected} startDraft={startDraft} />
                ),
              }}
            />
          ) : null}
        </Animated.View>
        <Animated.View {...layer("agent")}>
          {!agents.length ? (
            <NoAgents />
          ) : agentConv && agent ? (
            <Chat
              key={agentConv.id}
              chatId={agentConv.id}
              home={{
                onActivity: setActivity,
                renderIntro: ({ startDraft, connected }) => (
                  <AgentIntro
                    agent={agent}
                    mood={activity}
                    connected={connected}
                    startDraft={startDraft}
                  />
                ),
              }}
            />
          ) : null}
        </Animated.View>
      </View>
      <SideNav
        visible={navOpen}
        onClose={() => setNavOpen(false)}
        onNewChat={() => {
          setMode("chat");
          if (chatConv?.messages.length) startNew("chat");
        }}
        onOpen={openChat}
        exclude={chatConv?.messages.length ? undefined : chatConv?.id}
      />
    </Page>
  );
}

/**
 * A swipeable strip of agents. Each card is compact; the next one peeks in
 * from the edge so it is obvious you can swipe to switch.
 */
function AgentSwitcher({
  agents,
  agent,
  mood,
  connected,
  onSelect,
}: {
  agents: Agent[];
  agent: Agent;
  mood: AgentMood;
  connected: boolean;
  onSelect: (agent: Agent) => void;
}) {
  const { width } = useWindowDimensions();
  const [frame, setFrame] = useState(Math.min(width, 576));
  const cardWidth = frame - 64;
  const step = cardWidth + 10;
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const index = Math.max(
    0,
    agents.findIndex((a) => a.id === agent.id),
  );
  const pages = agents.length + 1;
  const settled = useRef(index);
  useEffect(() => {
    if (settled.current === index) return;
    settled.current = index;
    scroll.current?.scrollTo({ x: index * step, animated: true });
  }, [index, step]);
  return (
    <View
      onLayout={(e) => setFrame(e.nativeEvent.layout.width)}
      style={{ paddingTop: 10, gap: 6 }}
    >
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentOffset={{ x: index * step, y: 0 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / step);
          settled.current = i;
          if (agents[i]) onSelect(agents[i]);
        }}
      >
        {agents.map((a) => {
          const selected = a.id === agent.id;
          const status = moodLabel(selected ? mood : "idle", connected);
          return (
            <Tappable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={`${a.name}. ${status}. Swipe for other agents.`}
              accessibilityHint={selected ? "Opens agent profile" : undefined}
              onPress={() =>
                selected
                  ? router.push({
                      pathname: "/agent/[id]",
                      params: { id: a.id },
                    })
                  : onSelect(a)
              }
              scaleTo={0.97}
              style={[
                s.row,
                {
                  width: cardWidth,
                  height: 64,
                  gap: 12,
                  paddingHorizontal: 12,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: selected ? rgba(a.color, 0.4) : theme.hairline,
                  backgroundColor: theme.card,
                  backgroundImage: `linear-gradient(110deg, ${rgba(a.color, selected ? 0.2 : 0.08)} 0%, ${rgba(a.color, 0)} 75%)`,
                  boxShadow: selected
                    ? `0px 8px 22px -12px ${rgba(a.color, 0.6)}`
                    : theme.cardShadow,
                },
              ]}
            >
              <AgentCharacter
                agent={a}
                size={42}
                mood={selected ? mood : "idle"}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.3}
                  style={{ fontSize: 15, fontWeight: "700", color: theme.ink }}
                >
                  {a.name}
                </Text>
                <View style={[s.row, { gap: 6 }]}>
                  <View
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor:
                        selected && mood !== "idle"
                          ? a.color
                          : connected
                            ? "#22C55E"
                            : theme.quiet,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                    style={{ flex: 1, fontSize: 12, color: theme.sub }}
                  >
                    {status} · {agentPersona(a)}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={14} color={theme.quiet} />
            </Tappable>
          );
        })}
        {/* Last card: add or manage the team. */}
        <View
          style={[
            s.row,
            {
              width: cardWidth,
              height: 64,
              gap: 8,
              paddingHorizontal: 10,
              borderRadius: 22,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: theme.lineStrong,
            },
          ]}
        >
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Create agent"
            onPress={() => router.push("/agent/edit")}
            style={[s.row, { flex: 1, gap: 8, minHeight: 48 }]}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.pale,
              }}
            >
              <Icon name="add" size={20} color={theme.accentText} />
            </View>
            <Text style={[s.text, { fontWeight: "600" }]}>New agent</Text>
          </Tappable>
          <Tappable
            accessibilityRole="button"
            accessibilityLabel="Manage agents"
            onPress={() => router.push("/agents")}
            style={[
              s.row,
              {
                gap: 6,
                minHeight: 40,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: theme.muted,
              },
            ]}
          >
            <Icon name="people-outline" size={16} color={theme.sub} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: theme.sub }}>
              Manage
            </Text>
          </Tappable>
        </View>
      </ScrollView>
      {/* Page dots */}
      <View
        accessible={false}
        style={[s.row, { justifyContent: "center", gap: 5 }]}
      >
        {Array.from({ length: pages }, (_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 14 : 5,
              height: 5,
              borderRadius: 3,
              backgroundColor:
                i === index
                  ? agent.color
                  : i === pages - 1
                    ? theme.line
                    : theme.lineStrong,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function ConnectCard() {
  return (
    <View
      style={{
        alignSelf: "stretch",
        gap: 12,
        padding: 18,
        borderRadius: 22,
        backgroundColor: theme.pale,
        marginTop: 8,
      }}
    >
      <View style={[s.row, { gap: 12 }]}>
        <Icon name="key-outline" size={22} color={theme.accentText} />
        <View style={{ flex: 1 }}>
          <Text style={[s.text, { fontWeight: "600" }]}>
            Connect an AI provider
          </Text>
          <Text style={s.sub}>
            Use your own API key to get replies. Provider charges apply.
          </Text>
        </View>
      </View>
      <Button
        title="Connect API key"
        icon="key-outline"
        onPress={() => router.push("/connection")}
      />
    </View>
  );
}

function StarterChip({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  color?: string;
  onPress: () => void;
}) {
  return (
    <Tappable
      accessibilityRole="button"
      onPress={onPress}
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
          borderColor: color ? rgba(color, 0.3) : theme.hairline,
          boxShadow: theme.cardShadow,
        },
      ]}
    >
      <Icon name={icon} size={16} color={color || theme.accentText} />
      <Text
        numberOfLines={1}
        style={{ fontSize: 14, fontWeight: "600", color: theme.ink }}
      >
        {label}
      </Text>
    </Tappable>
  );
}

function ChatIntro({
  connected,
  startDraft,
}: {
  connected: boolean;
  startDraft: (prefix: string) => void;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: fontScale > 1.5 ? "flex-start" : "center",
        gap: 14,
        paddingVertical: 24,
      }}
    >
      <BrandMark height={60} float />
      <Text
        style={[
          s.h2,
          {
            textAlign: "center",
            fontSize: 28,
            fontWeight: "700",
            letterSpacing: -0.7,
          },
        ]}
      >
        How can I help?
      </Text>
      <Text style={[s.sub, { textAlign: "center", maxWidth: 320 }]}>
        {dayMood().greeting}. Ask a question, start a draft, or think out loud.
      </Text>
      {connected ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 6,
            maxWidth: 380,
          }}
        >
          {starters.map((item, i) => (
            <FadeIn key={item.label} delay={100 + i * 60}>
              <StarterChip
                label={item.label}
                icon={item.icon}
                onPress={() => startDraft(item.prefix)}
              />
            </FadeIn>
          ))}
        </View>
      ) : (
        <ConnectCard />
      )}
    </View>
  );
}

/** An empty agent session: the character greets you and offers a start. */
function AgentIntro({
  agent,
  mood,
  connected,
  startDraft,
}: {
  agent: Agent;
  mood: AgentMood;
  connected: boolean;
  startDraft: (prefix: string) => void;
}) {
  const goal = agent.goal?.trim();
  const prompts = [
    ...(goal
      ? [
          {
            label: "Continue our goal",
            prefix: `Let’s keep going on: ${goal}. `,
          },
        ]
      : []),
    { label: "Give it a task", prefix: "Here’s my task: " },
    { label: "Ask a question", prefix: "" },
  ];
  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 20,
      }}
    >
      <AgentCharacter agent={agent} size={76} mood={mood} />
      <Text
        style={[
          s.h2,
          { fontSize: 22, letterSpacing: -0.5, textAlign: "center" },
        ]}
      >
        Hi, I’m {agent.name}
      </Text>
      <Text style={[s.sub, { textAlign: "center", maxWidth: 300 }]}>
        {agentPersona(agent)}. What should we work on?
      </Text>
      {connected ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            marginTop: 6,
            maxWidth: 380,
          }}
        >
          {prompts.map((p) => (
            <StarterChip
              key={p.label}
              label={p.label}
              icon="flash-outline"
              color={agent.color}
              onPress={() => startDraft(p.prefix)}
            />
          ))}
        </View>
      ) : (
        <ConnectCard />
      )}
    </View>
  );
}

function NoAgents() {
  return (
    <ScrollView
      contentContainerStyle={{ gap: 14, paddingVertical: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <View style={[s.row, { gap: -10 }]}>
          {agentTemplates.map((t) => (
            <AgentCharacter
              key={t.title}
              agent={{ name: t.title, color: t.color }}
              size={60}
            />
          ))}
        </View>
        <Text style={[s.h2, { fontSize: 24, textAlign: "center" }]}>
          Meet your first agent
        </Text>
        <Text style={[s.sub, { textAlign: "center", maxWidth: 320 }]}>
          Give an agent a role once. It keeps its instructions and the facts you
          approve across every session.
        </Text>
      </View>
      {agentTemplates.map((t) => (
        <Tappable
          key={t.title}
          accessibilityRole="button"
          accessibilityLabel={`Start ${t.title}`}
          onPress={() =>
            router.push({
              pathname: "/agent/edit",
              params: { template: t.title },
            })
          }
          feel="card"
          scaleTo={0.98}
          style={[
            s.row,
            {
              gap: 14,
              padding: 14,
              borderRadius: 20,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.hairline,
              boxShadow: theme.cardShadow,
            },
          ]}
        >
          <AgentCharacter agent={{ name: t.title, color: t.color }} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={[s.text, { fontWeight: "600" }]}>{t.title}</Text>
            <Text style={s.sub}>{t.body}</Text>
          </View>
          <Icon name="chevron-forward" color={theme.quiet} size={14} />
        </Tappable>
      ))}
      <Button
        title="Create your own agent"
        icon="add"
        onPress={() => router.push("/agent/edit")}
      />
    </ScrollView>
  );
}

/**
 * A clock drawn from plain views, so the History button never depends on an
 * icon font having loaded.
 */
function HistoryGlyph({ size = 22 }: { size?: number }) {
  const stroke = Math.max(1.8, size * 0.09);
  const centre = size / 2;
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: theme.ink,
      }}
    >
      {/* Hour hand (up) and minute hand (right), meeting at the centre. */}
      <View
        style={{
          position: "absolute",
          left: centre - stroke * 1.5,
          top: size * 0.22 - stroke,
          width: stroke,
          height: centre - size * 0.22,
          borderRadius: stroke,
          backgroundColor: theme.ink,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: centre - stroke * 1.5,
          top: centre - stroke * 1.5,
          width: size * 0.26,
          height: stroke,
          borderRadius: stroke,
          backgroundColor: theme.ink,
        }}
      />
    </View>
  );
}
