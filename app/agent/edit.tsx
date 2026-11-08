import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { colors, uid } from "../../src/domain";
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
export default function AgentEdit() {
  const { id, fromChat } = useLocalSearchParams<{
    id?: string;
    fromChat?: string;
  }>();
  const { data, saveAgent, update } = useStore();
  const original = data.agents.find((a) => a.id === id);
  const source = data.conversations.find((c) => c.id === fromChat);
  const [name, setName] = useState(original?.name || "");
  const [description, setDescription] = useState(
    original?.description ||
      (source ? `A partner for ${source.title.toLowerCase()}` : ""),
  );
  const [instructions, setInstructions] = useState(
    original?.instructions || "",
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
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const agentId = await saveAgent(
        {
          name: name.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          connectionId,
          color,
        },
        id,
        fromChat,
      );
      if (!id && context.trim())
        await update((d) => ({
          ...d,
          agents: d.agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  memories: [
                    { id: uid(), text: context.trim(), createdAt: Date.now() },
                  ],
                }
              : a,
          ),
        }));
      router.replace({ pathname: "/agent/[id]", params: { id: agentId } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page>
      <Header
        title={
          original
            ? "Edit agent"
            : fromChat
              ? "Give this conversation continuity"
              : "Create an agent"
        }
      />
      <FormScroll>
        <View style={{ gap: 15 }}>
          <AgentAvatar agent={{ name, color }} large />
          <Text style={s.title}>
            {original ? "A little fine-tuning." : "Make it your own."}
          </Text>
          <Text style={s.sub}>
            A name, a purpose, and a way of working. Its memory stays separate
            from your other agents.
          </Text>
        </View>
        {!original && !source ? (
          <View style={{ gap: 10 }}>
            <Text style={s.eyebrow}>START WITH A ROLE, OR YOUR OWN IDEA</Text>
            <View style={[s.row, { gap: 7, flexWrap: "wrap" }]}>
              {templates.map((t) => (
                <Pressable
                  accessibilityRole="button"
                  key={t.name}
                  onPress={() => {
                    setName(t.name);
                    setDescription(t.description);
                    setInstructions(t.instructions);
                  }}
                  style={{
                    backgroundColor: theme.pale,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 9,
                  }}
                >
                  <Text style={{ color: theme.green, fontSize: 12 }}>
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        <Field
          label="Name"
          value={name}
          onChangeText={setName}
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
                borderColor: color === c ? "#B9CCBC" : theme.bg,
              }}
            />
          ))}
        </View>
        <Field
          label="Its purpose"
          value={description}
          onChangeText={setDescription}
          placeholder="What would you like help with?"
          maxLength={200}
        />
        <Field
          label="How it should work"
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Be thoughtful and direct. Help me explore options and choose the next step…"
          maxLength={8000}
          style={{ minHeight: 150 }}
          help="These instructions guide every conversation with this agent."
        />
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
            Tell it “remember that…” to save a fact, or manage its memory
            yourself. This version has local memory tools; browsing and external
            actions are not connected.
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
