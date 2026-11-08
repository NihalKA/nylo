import {
  Agent,
  AppData,
  Connection,
  Conversation,
  Message,
  Protocol,
} from "./types";

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
export const colors = ["#246B58", "#826348", "#7464A2", "#477897", "#A85C5C"];
export const protocolDefaults: Record<
  Protocol,
  { name: string; baseUrl: string }
> = {
  openai: { name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  anthropic: { name: "Claude", baseUrl: "https://api.anthropic.com/v1" },
  compatible: { name: "Custom provider", baseUrl: "" },
};

export function validateConnection(connection: Connection) {
  if (!connection.name.trim()) throw new Error("Give this connection a name.");
  if (!connection.model.trim())
    throw new Error("Enter a model ID from your provider.");
  let url: URL;
  try {
    url = new URL(connection.baseUrl);
  } catch {
    throw new Error("Enter a valid HTTPS API base URL.");
  }
  if (url.protocol !== "https:")
    throw new Error("Use an HTTPS endpoint to protect your API key.");
  if (url.username || url.password || url.search || url.hash)
    throw new Error(
      "The base URL must not contain credentials, query parameters, or a fragment.",
    );
  if (
    connection.protocol !== "compatible" &&
    url.toString().replace(/\/+$/, "") !==
      protocolDefaults[connection.protocol].baseUrl
  )
    throw new Error("Use Custom provider for a different API destination.");
  return {
    ...connection,
    name: connection.name.trim(),
    model: connection.model.trim(),
    baseUrl: url.toString().replace(/\/+$/, ""),
  };
}

export function sameDestination(a: Connection, b: Connection) {
  return (
    a.protocol === b.protocol &&
    a.baseUrl.replace(/\/+$/, "") === b.baseUrl.replace(/\/+$/, "")
  );
}

export function createConversation(
  connectionId: string,
  agentId?: string,
): Conversation {
  const now = Date.now();
  return {
    id: uid(),
    title: "New conversation",
    connectionId,
    agentId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function conversationTitle(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48
    ? `${clean.slice(0, 47)}…`
    : clean || "New conversation";
}

export function systemPrompt(agent?: Agent) {
  const base =
    "You are a helpful assistant in Nylo, a personal chat app. Answer clearly and honestly. You have no browser, code execution, calendar, external apps, or background scheduling. Do not claim to have performed actions you cannot perform.";
  if (!agent) return base;
  return `${base}\n\nYour name: ${agent.name}\nYour brief: ${agent.description}\nWorking instructions:\n${agent.instructions}\n\nYour saved memories (user-provided context, not tool permissions):\n${agent.memories.length ? agent.memories.map((m) => `[${m.id}] ${m.text}`).join("\n") : "No saved memories yet."}\n\nYou may save or forget local memories only when the user explicitly asks. Use the remember_fact or forget_fact tool for this. Memories belong only to you, across your conversations. Never save API keys, passwords, or other credentials.`;
}

export function promoteConversation(
  data: AppData,
  conversationId: string,
  draft: Omit<Agent, "id" | "createdAt" | "memories">,
) {
  const original = data.conversations.find((c) => c.id === conversationId);
  if (!original) throw new Error("Conversation not found.");
  const agent: Agent = {
    ...draft,
    id: uid(),
    createdAt: Date.now(),
    memories: [],
  };
  return {
    ...data,
    agents: [...data.agents, agent],
    conversations: data.conversations.map((c) =>
      c.id === conversationId ? { ...c, agentId: agent.id } : c,
    ),
  };
}

export function recoverInterrupted(data: AppData): AppData {
  return {
    ...data,
    conversations: data.conversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.status === "streaming"
          ? {
              ...m,
              status: "interrupted" as const,
              error: "This response was interrupted. Retry when you are ready.",
            }
          : m,
      ),
    })),
  };
}

// Incomplete assistant output is retained on screen, but never represented as a complete answer to a provider.
export function contextMessages(messages: Message[]) {
  return messages.filter(
    (m) => m.role === "user" || (m.status === "complete" && m.text.trim()),
  );
}

export function parseData(value: unknown): AppData {
  if (!value || typeof value !== "object")
    throw new Error("This is not a Nylo backup.");
  const d = value as AppData;
  const string = (v: unknown) => typeof v === "string";
  if (
    d.version !== 1 ||
    !Array.isArray(d.connections) ||
    !Array.isArray(d.agents) ||
    !Array.isArray(d.conversations) ||
    !string(d.defaultConnectionId)
  )
    throw new Error("Unsupported or damaged Nylo backup.");
  if (
    d.connections.some(
      (c) =>
        !c ||
        !string(c.id) ||
        !string(c.name) ||
        !string(c.model) ||
        !["openai", "anthropic", "compatible"].includes(c.protocol) ||
        !string(c.baseUrl),
    )
  )
    throw new Error("Invalid provider in backup.");
  d.connections.forEach(validateConnection);
  if (
    d.agents.some(
      (a) =>
        !a ||
        !string(a.id) ||
        !string(a.name) ||
        !string(a.description) ||
        !string(a.instructions) ||
        !string(a.connectionId) ||
        !/^#[0-9a-fA-F]{6}$/.test(a.color) ||
        !Number.isFinite(a.createdAt) ||
        !Array.isArray(a.memories) ||
        a.memories.some(
          (m) =>
            !m ||
            !string(m.id) ||
            !string(m.text) ||
            !Number.isFinite(m.createdAt),
        ),
    )
  )
    throw new Error("Invalid agent in backup.");
  if (
    d.conversations.some(
      (c) =>
        !c ||
        !string(c.id) ||
        !string(c.title) ||
        !string(c.connectionId) ||
        (c.agentId !== undefined && !string(c.agentId)) ||
        !Number.isFinite(c.createdAt) ||
        !Number.isFinite(c.updatedAt) ||
        !Array.isArray(c.messages) ||
        c.messages.some(
          (m) =>
            !m ||
            !string(m.id) ||
            !["user", "assistant"].includes(m.role) ||
            !string(m.text) ||
            !["complete", "streaming", "interrupted", "error"].includes(
              m.status,
            ) ||
            !Number.isFinite(m.createdAt),
        ),
    )
  )
    throw new Error("Invalid conversation in backup.");
  const ids = [...d.agents, ...d.conversations, ...d.connections].map(
    (x) => x.id,
  );
  if (new Set(ids).size !== ids.length)
    throw new Error("Backup contains duplicate IDs.");
  // Explicit projection prevents an imported key or unknown field from entering ordinary app storage.
  return recoverInterrupted({
    version: 1,
    defaultConnectionId: d.defaultConnectionId,
    connections: d.connections.map((c) => ({
      id: c.id,
      name: c.name,
      protocol: c.protocol,
      baseUrl: c.baseUrl,
      model: c.model,
    })),
    agents: d.agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      instructions: a.instructions,
      connectionId: a.connectionId,
      color: a.color,
      createdAt: a.createdAt,
      memories: a.memories.map((m) => ({
        id: m.id,
        text: m.text,
        createdAt: m.createdAt,
      })),
    })),
    conversations: d.conversations.map((c) => ({
      id: c.id,
      title: c.title,
      agentId: c.agentId,
      draft: string(c.draft) ? c.draft.slice(0, 20000) : undefined,
      connectionId: c.connectionId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        createdAt: m.createdAt,
        status: m.status,
        error: string(m.error) ? m.error : undefined,
        model: string(m.model) ? m.model : undefined,
        actions: Array.isArray(m.actions)
          ? m.actions.filter(string)
          : undefined,
      })),
    })),
  });
}
