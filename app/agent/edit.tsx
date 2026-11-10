import { Text } from "../../src/typography";
import React, { useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { colors, isDeviceCheckConversation } from "../../src/domain";
import {
  AgentAvatar,
  Badge,
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
} from "../../src/ui";

const templates = [
  {
    name: "Thinking partner",
    description: "A clear head for ideas and decisions.",
    instructions:
      "Help me think clearly. Ask one useful question at a time. Explore alternatives, point out weak assumptions respectfully, and turn our discussion into practical next steps.",
  },
  {
    name: "Writing partner",
    description: "Find the words that sound like you.",
    instructions:
      "Help me write with clarity and personality. Ask about the audience and goal when needed. Give concrete drafts and useful edits. Learn my style from the preferences I explicitly ask you to remember.",
  },
  {
    name: "Project guide",
    description: "Keep the context. Find the next step.",
    instructions:
      "Help me move my project forward. Keep decisions clear, identify open questions, and suggest manageable next steps. Be honest about what you know and what still needs to be checked.",
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
  const { id, fromChat, template } = useLocalSearchParams<{
    id?: string;
    fromChat?: string;
    template?: string;
  }>();
  const { data, saveAgent } = useStore();
  const original = data.agents.find((a) => a.id === id);
  const initial = original || templates.find((t) => t.name === template);
  const source = data.conversations.find((c) => c.id === fromChat);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(
    initial?.description ||
      (source ? `A partner for ${source.title.toLowerCase()}` : ""),
  );
  const [instructions, setInstructions] = useState(initial?.instructions || "");
  const [goal, setGoal] = useState(original?.goal || "");
  const [workflow, setWorkflow] = useState<"direct" | "plan" | "coach">(
    original?.workflow || "direct",
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
  const [color, setColor] = useState(original?.color || colors[0]);
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
        <View
          style={[
            s.card,
            s.row,
            {
              gap: 16,
              padding: 16,
              minHeight: 91,
              boxShadow:
                "0px 4px 16px -2px rgba(30,43,88,0.06), 0px 1px 3px rgba(30,43,88,0.04)",
              backgroundColor: theme.surface,
            },
          ]}
        >
          <AgentAvatar
            agent={{ name, color }}
            size={48}
            textStyle={{ fontWeight: "700", letterSpacing: -0.33 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.h2, { letterSpacing: -0.18, lineHeight: 22.5 }]}>
              {name || "Your agent"}
            </Text>
            <Text style={[s.sub, { fontSize: 12, lineHeight: 16 }]}>
              Instructions and memory for the work you return to.
            </Text>
          </View>
        </View>
        {!original && !source ? (
          <View style={{ gap: 8 }}>
            <Text style={s.eyebrow}>Start with a role</Text>
            <View
              style={[s.row, { columnGap: 8, rowGap: 0, flexWrap: "wrap" }]}
            >
              {templates.map((t) => (
                <Pressable
                  accessibilityRole="button"
                  key={t.name}
                  accessibilityState={{
                    selected:
                      name === t.name && instructions === t.instructions,
                  }}
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
                      setRoleEdited(false);
                    })()
                  }
                  style={{
                    minWidth:
                      t.name === "Thinking partner"
                        ? 134.36
                        : t.name === "Writing partner"
                          ? 125.58
                          : 113.73,
                    maxWidth: "100%",
                    backgroundColor: "transparent",
                    minHeight: 44,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: 5,
                    paddingHorizontal: 12,
                  }}
                >
                  <View
                    accessible={false}
                    style={{
                      position: "absolute",
                      top: 5,
                      bottom: 5,
                      left: 0,
                      right: 0,
                      borderRadius: 17,
                      borderWidth: 1,
                      borderColor:
                        name === t.name && instructions === t.instructions
                          ? theme.primary
                          : "#C6C5D099",
                      backgroundColor:
                        name === t.name && instructions === t.instructions
                          ? theme.primary
                          : theme.surface,
                    }}
                  />
                  <Text
                    style={{
                      color:
                        name === t.name && instructions === t.instructions
                          ? theme.onPrimary
                          : theme.ink,
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: "500",
                      letterSpacing: 0.24,
                    }}
                  >
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Field
          testID="agent-name"
          label="Name"
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
        <View style={[s.row, { gap: 6, marginTop: -16 }]}>
          {colors.map((c) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`Agent color ${c}`}
              accessibilityState={{ checked: color === c }}
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: c,
                  boxShadow:
                    color === c
                      ? "0px 0px 0px 2px #F9F9F8, 0px 0px 0px 4px #061542"
                      : undefined,
                }}
              />
            </Pressable>
          ))}
        </View>
        <Field
          label="Its purpose"
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
            <Text style={s.text}>Working approach</Text>
            <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
              {(["direct", "plan", "coach"] as const).map((value) => (
                <Button
                  key={value}
                  title={
                    value === "direct"
                      ? "Work directly"
                      : value === "plan"
                        ? "Plan & deliver"
                        : "Coach me"
                  }
                  secondary={workflow !== value}
                  onPress={() => setWorkflow(value)}
                />
              ))}
            </View>
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
                  <Pressable
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
                          connectionId === c.id ? theme.pale : "#FFF",
                      },
                    ]}
                  >
                    <Text style={s.text}>
                      {c.name} · {c.model}
                    </Text>
                  </Pressable>
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
          borderTopColor: "rgba(232,232,231,0.6)",
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
