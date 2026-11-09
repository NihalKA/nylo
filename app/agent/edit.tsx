import React, { useRef, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { colors, isDeviceCheckConversation } from "../../src/domain";
import {
  AgentAvatar,
  Badge,
  Button,
  Field,
  FormScroll,
  Header,
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
        dismissKeyboard
        title={
          original
            ? "Edit agent"
            : fromChat
              ? "Give this conversation continuity"
              : "Create an agent"
        }
      />
      <FormScroll>
        <View style={[s.card, s.row, { gap: 14, padding: 16 }]}>
          <AgentAvatar agent={{ name, color }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.h2}>{name || "Your agent"}</Text>
            <Text style={s.sub}>
              Instructions and memory for the work you return to.
            </Text>
          </View>
        </View>
        {!original && !source ? (
          <View style={{ gap: 10 }}>
            <Text style={s.eyebrow}>Start with a role</Text>
            <View style={[s.row, { gap: 7, flexWrap: "wrap" }]}>
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
                    backgroundColor:
                      name === t.name && instructions === t.instructions
                        ? theme.ink
                        : theme.surface,
                    borderWidth: 1,
                    borderColor: theme.line,
                    minHeight: 44,
                    justifyContent: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 22,
                  }}
                >
                  <Text
                    style={{
                      color:
                        name === t.name && instructions === t.instructions
                          ? theme.onPrimary
                          : theme.ink,
                      fontSize: 13,
                      fontWeight: "600",
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
          value={name}
          onChangeText={(value) => {
            setName(value);
            setRoleEdited(true);
          }}
          placeholder="What should we call your agent?"
          maxLength={50}
        />
        <View style={[s.row, { gap: 12 }]}>
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
                borderRadius: 15,
                backgroundColor: c,
                borderWidth: 3,
                borderColor: color === c ? theme.ink : theme.bg,
              }}
            />
          ))}
        </View>
        <Field
          label="Its purpose"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setRoleEdited(true);
          }}
          placeholder="What would you like help with?"
          maxLength={200}
        />
        <Field
          label="How it should work"
          value={instructions}
          onChangeText={(value) => {
            setInstructions(value);
            setRoleEdited(true);
          }}
          multiline
          placeholder="Be thoughtful and direct. Help me explore options and choose the next step…"
          maxLength={8000}
          style={{ minHeight: 150 }}
          help="These instructions guide every conversation with this agent."
        />
        <Field
          label="Current goal"
          value={goal}
          onChangeText={setGoal}
          multiline
          maxLength={2000}
          placeholder="What outcome are you working toward?"
          help="Shared across this agent’s chats until you change it."
        />
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
            Carry relevant text context between this agent’s conversations. You
            approve enabling this before it is shared. Other agents stay
            separate. Files themselves are excluded; conversation text quoting
            or discussing them may be included.
          </Text>
        </View>
        {source ? (
          <Field
            label="Context to carry forward"
            value={context}
            onChangeText={setContext}
            multiline
            maxLength={1000}
            style={{ minHeight: 150 }}
            help="Review this excerpt before saving. It becomes an editable memory; the original conversation moves into this agent."
          />
        ) : null}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.ink }}>
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
            Useful preferences and decisions can be proposed as memories. You
            approve each save, or add facts yourself. This version has local
            memory tools; browsing and external actions are not connected.
          </Text>
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button
          title={original ? "Save changes" : "Create agent"}
          icon="sparkles-outline"
          loading={busy}
          onPress={() => void save()}
        />
      </FormScroll>
    </Page>
  );
}
