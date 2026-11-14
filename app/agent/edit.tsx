import { Text } from "../../src/typography";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import {
  agentColors,
  colors,
  isDeviceCheckConversation,
} from "../../src/domain";
import { AgentCharacter, agentPersona } from "../../src/agent-character";
import {
  Badge,
  Icon,
  PulseRing,
  Button,
  Switch,
  Field,
  FormScroll,
  Header,
  IconButton,
  Page,
  s,
  theme,
  confirm,
  useTheme,
  AuraPicker,
  rgba,
  Press,
} from "../../src/ui";

const templates = [
  {
    name: "Thinking partner",
    color: "#C2650F",
    workflow: "coach" as const,
    description: "A clear head for ideas and decisions.",
    instructions:
      "Help me think clearly. Ask one useful question at a time. Explore alternatives, point out weak assumptions respectfully, and turn our discussion into practical next steps.",
  },
  {
    name: "Writing partner",
    color: "#2F5BEA",
    workflow: "direct" as const,
    description: "Find the words that sound like you.",
    instructions:
      "Help me write with clarity and personality. Ask about the audience and goal when needed. Give concrete drafts and useful edits. Learn my style from the preferences I explicitly ask you to remember.",
  },
  {
    name: "Project guide",
    color: "#1F8A4C",
    workflow: "plan" as const,
    description: "Keep the context. Find the next step.",
    instructions:
      "Help me move my project forward. Keep decisions clear, identify open questions, and suggest manageable next steps. Be honest about what you know and what still needs to be checked.",
  },
];
const personalities = [
  {
    value: "direct" as const,
    title: "Doer",
    body: "Gets straight to the work and hands you results",
    icon: "flash-outline" as const,
  },
  {
    value: "plan" as const,
    title: "Planner",
    body: "Lays out the steps, then delivers each one",
    icon: "list-outline" as const,
  },
  {
    value: "coach" as const,
    title: "Coach",
    body: "Asks good questions and guides you through",
    icon: "school-outline" as const,
  },
];
export default function AgentEditRoute() {
  const params = useLocalSearchParams<{
    id?: string;
    fromChat?: string;
    template?: string;
  }>();
  return (
    <AgentEdit key={params.id || params.fromChat || params.template || "new"} />
  );
}

function AgentEdit() {
  useTheme();
  const { id, fromChat, template } = useLocalSearchParams<{
    id?: string;
    fromChat?: string;
    template?: string;
  }>();
  const { data, saveAgent } = useStore();
  const original = data.agents.find((a) => a.id === id);
  const chosenTemplate = templates.find((t) => t.name === template);
  const initial = original || chosenTemplate;
  const source = data.conversations.find((c) => c.id === fromChat);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(
    initial?.description ||
      (source ? `A partner for ${source.title.toLowerCase()}` : ""),
  );
  const [instructions, setInstructions] = useState(initial?.instructions || "");
  const [goal, setGoal] = useState(original?.goal || "");
  const [workflow, setWorkflow] = useState<"direct" | "plan" | "coach">(
    original?.workflow || chosenTemplate?.workflow || "direct",
  );
  const [shareRecentChats, setShareRecentChats] = useState(
    original?.shareRecentChats || false,
  );
  const [context, setContext] = useState(
    source
      ? source.messages
          .filter((m) => m.status === "complete")
          .slice(-4)
          .map((m) => `${m.role === "user" ? "You" : "Assistant"}: ${m.text}`)
          .join("\n\n")
          .slice(0, 1000)
      : "",
  );
  const [connectionId, setConnectionId] = useState(
    original?.connectionId || source?.connectionId || data.defaultConnectionId,
  );
  const [color, setColor] = useState(
    original?.color || chosenTemplate?.color || colors[0],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saveLocked = useRef(false);
  const [roleEdited, setRoleEdited] = useState(false);
  const [showOptions, setShowOptions] = useState(!!original || !!source);
  if (
    (id && id === data.deviceCheck?.agentId) ||
    (fromChat && isDeviceCheckConversation(data, fromChat))
  )
    return (
      <Page>
        <Header title="Device check" />
        <Text style={s.text}>Test data is managed by Live device check.</Text>
        <Button
          title="Open live device check"
          onPress={() => router.replace("/device-check")}
        />
      </Page>
    );
  const save = async () => {
    if (saveLocked.current) return;
    saveLocked.current = true;
    setBusy(true);
    setError("");
    try {
      if (
        shareRecentChats &&
        !original?.shareRecentChats &&
        !(await confirm(
          "Use this agent’s recent chats?",
          "Future messages may send up to eight recent conversations from this agent, in bounded text excerpts, to your selected AI provider. Other agents and ordinary chats stay separate. Turn this off in the agent’s Memory section. Saved facts and original chats are managed separately.",
          "Enable context",
          false,
        ))
      )
        return;
      const agentId = await saveAgent(
        {
          name: name.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          goal: goal.trim(),
          workflow,
          shareRecentChats,
          connectionId,
          color,
        },
        id,
        fromChat,
        context,
      );
      router.replace({ pathname: "/agent/[id]", params: { id: agentId } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      saveLocked.current = false;
      setBusy(false);
    }
  };
  return (
    <Page>
      <Header
        centerTitle={!original && !fromChat}
        right={
          <IconButton
            name="ellipsis-horizontal"
            design="more"
            label={
              showOptions
                ? "Hide additional options"
                : "Additional agent options"
            }
            onPress={() => setShowOptions(!showOptions)}
          />
        }
        dismissKeyboard
        titleStyle={{ fontSize: 22, letterSpacing: -0.55 }}
        title={
          original
            ? "Edit agent"
            : fromChat
              ? "Give this conversation continuity"
              : "Create an agent"
        }
      />
      <FormScroll contentStyle={{ paddingTop: 4, paddingBottom: 24 }}>
        {/* Live preview: the character you are creating, in its own light. */}
        <View
          style={{
            alignItems: "center",
            gap: 8,
            paddingTop: 22,
            paddingBottom: 18,
            paddingHorizontal: 18,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: rgba(color, 0.28),
            backgroundColor: theme.card,
            backgroundImage: `radial-gradient(circle at 50% 0%, ${rgba(color, 0.32)} 0%, ${rgba(color, 0)} 68%), linear-gradient(160deg, ${rgba(color, 0.1)} 0%, ${rgba(color, 0)} 60%)`,
            boxShadow: `0px 12px 32px -14px ${rgba(color, 0.45)}`,
          }}
        >
          <View
            style={{
              width: 112,
              height: 112,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PulseRing color={color} size={88} />
            <AgentCharacter
              agent={{ name: name || "Agent", color }}
              size={86}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[s.h2, { fontSize: 22, letterSpacing: -0.5 }]}
          >
            {name.trim() || "Your new agent"}
          </Text>
          <Text
            numberOfLines={2}
            style={[s.sub, { textAlign: "center", maxWidth: 300 }]}
          >
            {description.trim() || agentPersona({ workflow })}
          </Text>
        </View>
        {/* Role cards only on a blank "Create agent": opening from a template
            has already chosen the role. */}
        {!original && !source && !chosenTemplate ? (
          <View style={{ gap: 10 }}>
            <Text style={s.eyebrow}>Start from a character</Text>
            <View style={[s.row, { gap: 10 }]}>
              {templates.map((t) => {
                const selected =
                  name === t.name && instructions === t.instructions;
                return (
                  <Press
                    feel="select"
                    accessibilityRole="button"
                    key={t.name}
                    accessibilityLabel={`${t.name}. ${t.description}`}
                    accessibilityState={{ selected }}
                    disabled={busy}
                    onPress={() =>
                      void (async () => {
                        if (
                          roleEdited &&
                          !(await confirm(
                            "Replace this setup?",
                            "This replaces the name, purpose and instructions you edited. Your current text is kept if you cancel.",
                            "Use role",
                            false,
                          ))
                        )
                          return;
                        setName(t.name);
                        setDescription(t.description);
                        setInstructions(t.instructions);
                        setColor(t.color);
                        setWorkflow(t.workflow);
                        setRoleEdited(false);
                      })()
                    }
                    style={{
                      flex: 1,
                      alignItems: "center",
                      gap: 8,
                      paddingVertical: 14,
                      paddingHorizontal: 6,
                      borderRadius: 20,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? t.color : theme.hairline,
                      backgroundColor: theme.card,
                      backgroundImage: `radial-gradient(circle at 50% 0%, ${rgba(t.color, selected ? 0.22 : 0.1)} 0%, ${rgba(t.color, 0)} 70%)`,
                    }}
                  >
                    <AgentCharacter
                      agent={{ name: t.name, color: t.color }}
                      size={44}
                    />
                    <Text
                      numberOfLines={2}
                      maxFontSizeMultiplier={1.4}
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: theme.ink,
                        textAlign: "center",
                      }}
                    >
                      {t.name}
                    </Text>
                  </Press>
                );
              })}
            </View>
          </View>
        ) : null}
        {/* Personality: how the agent approaches the work. */}
        <View style={{ gap: 10 }}>
          <Text style={s.eyebrow}>Personality</Text>
          {personalities.map((p) => {
            const selected = workflow === p.value;
            return (
              <Press
                key={p.value}
                feel="select"
                accessibilityRole="radio"
                accessibilityLabel={`${p.title}. ${p.body}`}
                accessibilityState={{ selected, checked: selected }}
                onPress={() => setWorkflow(p.value)}
                style={[
                  s.row,
                  {
                    gap: 12,
                    minHeight: 60,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 18,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? color : theme.hairline,
                    backgroundColor: selected ? rgba(color, 0.08) : theme.card,
                  },
                ]}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: rgba(color, selected ? 0.18 : 0.08),
                  }}
                >
                  <Icon name={p.icon} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.text, { fontWeight: "600" }]}>{p.title}</Text>
                  <Text style={[s.sub, { fontSize: 12 }]}>{p.body}</Text>
                </View>
                {selected ? (
                  <Icon name="checkmark-circle" size={20} color={color} />
                ) : null}
              </Press>
            );
          })}
        </View>
        <Field
          testID="agent-name"
          label="Name"
          tint={color}
          labelStyle={s.eyebrow}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setRoleEdited(true);
          }}
          placeholder="What should we call your agent?"
          maxLength={50}
          style={{ letterSpacing: -0.08 }}
        />
        <View style={{ marginTop: -8 }}>
          <AuraPicker
            value={color}
            onChange={setColor}
            name={name || "Agent"}
            options={agentColors}
          />
        </View>
        <Field
          label="Its purpose"
          tint={color}
          labelStyle={s.eyebrow}
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setRoleEdited(true);
          }}
          placeholder="What would you like help with?"
          maxLength={200}
          style={{ letterSpacing: -0.08 }}
        />
        <Field
          label="How it should work"
          tint={color}
          labelStyle={s.eyebrow}
          value={instructions}
          onChangeText={(value) => {
            setInstructions(value);
            setRoleEdited(true);
          }}
          multiline
          scrollEnabled={false}
          placeholder="Be thoughtful and direct. Help me explore options and choose the next step…"
          maxLength={8000}
          style={{
            minHeight: 131,
            fontSize: 14,
            lineHeight: 22.75,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          help="These instructions guide every conversation with this agent."
        />
        <Field
          label="Current goal"
          tint={color}
          labelStyle={s.eyebrow}
          style={{
            minHeight: 108,
            fontSize: 14,
            lineHeight: 22.75,
            paddingHorizontal: 12,
            paddingVertical: 12,
          }}
          value={goal}
          onChangeText={setGoal}
          multiline
          scrollEnabled={false}
          maxLength={2000}
          placeholder="What outcome are you working toward?"
          help="Shared across this agent’s chats until you change it."
        />
        {showOptions ? (
          <View style={{ gap: 20 }}>
            <View style={{ gap: 8 }}>
              <Text style={s.text}>Use recent chats</Text>
              <Switch
                accessibilityLabel="Use recent chats from this agent"
                value={shareRecentChats}
                onValueChange={setShareRecentChats}
              />
              <Text style={s.sub}>
                Carry relevant text context between this agent’s conversations.
                You approve enabling this before it is shared. Other agents stay
                separate. Files themselves are excluded; conversation text
                quoting or discussing them may be included.
              </Text>
            </View>
            {source ? (
              <Field
                label="Context to carry forward"
                value={context}
                onChangeText={setContext}
                multiline
                scrollEnabled={false}
                maxLength={1000}
                style={{ minHeight: 150 }}
                help="Review this excerpt before saving. It becomes an editable memory; the original conversation moves into this agent."
              />
            ) : null}
            <View style={{ gap: 8 }}>
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: theme.ink }}
              >
                Default connection
              </Text>
              {data.connections.length ? (
                data.connections.map((c) => (
                  <Press
                    accessibilityRole="radio"
                    accessibilityState={{ checked: connectionId === c.id }}
                    key={c.id}
                    onPress={() => setConnectionId(c.id)}
                    style={[
                      s.card,
                      {
                        padding: 14,
                        borderColor:
                          connectionId === c.id ? theme.green : theme.line,
                        backgroundColor:
                          connectionId === c.id ? theme.pale : theme.card,
                      },
                    ]}
                  >
                    <Text style={s.text}>
                      {c.name} · {c.model}
                    </Text>
                  </Press>
                ))
              ) : (
                <Text style={s.sub}>
                  You can create the agent now and add a connection in Settings
                  before chatting.
                </Text>
              )}
            </View>
            <View style={[s.card, { gap: 9 }]}>
              <Badge text="LOCAL MEMORY" icon="sparkles-outline" />
              <Text style={s.sub}>
                Useful preferences and decisions can be proposed as memories.
                You approve each save, or add facts yourself. This version has
                local memory tools; browsing and external actions are not
                connected.
              </Text>
            </View>
          </View>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
      </FormScroll>
      <View
        style={{
          paddingTop: 12,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: theme.hairline,
          backgroundColor: theme.bg,
        }}
      >
        <Button
          title={original ? "Save changes" : "Save & start agent"}
          accessibilityLabel={original ? "Save changes" : "Create agent"}
          icon="arrow-forward"
          designIcon="forward"
          iconPosition="end"
          loading={busy}
          onPress={() => void save()}
        />
      </View>
    </Page>
  );
}
