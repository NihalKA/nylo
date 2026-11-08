import { credentialDestination } from "./credentials";
import { createCheckpointBarrier, createDurableUpdater } from "./persistence";
import { askPermission } from "./consent";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { Agent, AppData, Connection, Message, emptyData } from "./types";
import {
  contextMessages,
  conversationTitle,
  createConversation,
  parseData,
  promoteConversation,
  recoverInterrupted,
  systemPrompt,
  uid,
  validateConnection,
} from "./domain";
import { readData, readKey, removeKey, writeData, writeKey } from "./storage";
import { runAgent, safeError } from "./providers";
import { streamingFetch } from "./transport";

type AgentDraft = Omit<Agent, "id" | "createdAt" | "memories">;
type Store = {
  data: AppData;
  ready: boolean;
  storageError: string;
  runningId: string | null;
  update: (change: (d: AppData) => AppData) => Promise<void>;
  newChat: (agentId?: string) => Promise<string>;
  saveAgent: (
    draft: AgentDraft,
    id?: string,
    fromChat?: string,
  ) => Promise<string>;
  saveConnection: (connection: Connection, key: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  send: (
    conversationId: string,
    text: string,
    retry?: boolean,
    onAccepted?: () => void,
  ) => Promise<void>;
  stop: () => void;
  importBackup: (value: unknown) => Promise<void>;
};
const StoreContext = createContext<Store | null>(null);
export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error("Store missing");
  return s;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const current = useRef(data);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const active = useRef<{ controller: AbortController; id: string } | null>(
    null,
  );
  const durableUpdate = useRef<ReturnType<
    typeof createDurableUpdater<AppData>
  > | null>(null);
  if (!durableUpdate.current)
    durableUpdate.current = createDurableUpdater<AppData>({
      read: () => current.current,
      write: writeData,
      commit: (next) => {
        current.current = next;
        setData(next);
      },
    });
  const consentedDestinations = useRef(new Set<string>());
  const update = async (change: (d: AppData) => AppData) => {
    const operation = durableUpdate.current!(change);
    try {
      await operation;
      setStorageError("");
    } catch {
      setStorageError(
        "Your last change could not be saved. Check device storage, then try again.",
      );
      throw new Error("Could not save on this device.");
    }
  };
  const cleanupRetiredCredentials = async () => {
    const activeIds = new Set(
      current.current.connections.map((c) => c.credentialId || c.id),
    );
    const removed: string[] = [];
    for (const id of current.current.retiredCredentialIds || []) {
      if (!activeIds.has(id)) {
        try {
          await removeKey(id);
          removed.push(id);
        } catch {
          /* keep retirement journal for retry */
        }
      }
    }
    if (removed.length)
      await update((d) => ({
        ...d,
        retiredCredentialIds: (d.retiredCredentialIds || []).filter(
          (id) => !removed.includes(id),
        ),
      }));
    if (current.current.retiredCredentialIds?.length)
      setStorageError(
        "Some old API keys could not be erased. Reopen Nylo to retry secure cleanup.",
      );
  };
  useEffect(() => {
    if (ready) void cleanupRetiredCredentials().catch(() => {});
  }, [ready]);
  useEffect(() => {
    let mounted = true;
    readData()
      .then(async (value) => {
        const recovered = recoverInterrupted(value);
        try {
          await writeData(recovered);
        } catch {
          if (mounted)
            setStorageError(
              "Your saved chats are available, but changes cannot be saved. Free some device storage, then reopen Nylo.",
            );
        }
        if (mounted) {
          current.current = recovered;
          setData(recovered);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted)
          setStorageError(
            "Could not open local data. Your existing data has not been overwritten. Restart the app to try again.",
          );
      });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") active.current?.controller.abort();
    });
    return () => {
      mounted = false;
      subscription.remove();
      active.current?.controller.abort();
    };
  }, []);

  const newChat = async (agentId?: string) => {
    const agent = current.current.agents.find((a) => a.id === agentId);
    const conversation = createConversation(
      agent?.connectionId || current.current.defaultConnectionId,
      agentId,
    );
    await update((d) => ({
      ...d,
      conversations: [conversation, ...d.conversations],
    }));
    return conversation.id;
  };
  const saveAgent = async (
    draft: AgentDraft,
    id?: string,
    fromChat?: string,
  ) => {
    if (!draft.name.trim()) throw new Error("Give your agent a name.");
    if (fromChat) {
      let created = "";
      await update((d) => {
        const next = promoteConversation(d, fromChat, draft);
        created = next.agents.at(-1)!.id;
        return next;
      });
      return created;
    }
    const agentId = id || uid();
    await update((d) => ({
      ...d,
      agents: id
        ? d.agents.map((a) => (a.id === id ? { ...a, ...draft } : a))
        : [
            ...d.agents,
            { ...draft, id: agentId, memories: [], createdAt: Date.now() },
          ],
    }));
    return agentId;
  };
  const saveConnection = async (input: Connection, key: string) => {
    const connection = validateConnection(input);
    const previous = current.current.connections.find(
      (c) => c.id === connection.id,
    );
    if (
      !key.trim() &&
      previous &&
      (previous.protocol !== connection.protocol ||
        previous.baseUrl !== connection.baseUrl)
    )
      throw new Error(
        "Enter the API key again when changing a provider or endpoint.",
      );
    const previousId = previous?.credentialId || previous?.id;
    const nextId = key.trim() ? uid() : previousId;
    if (!nextId) throw new Error("Enter your API key.");
    if (key.trim())
      await writeKey(nextId, key.trim(), credentialDestination(connection));
    else if (!(await readKey(nextId, credentialDestination(connection))))
      throw new Error(
        "Re-enter your API key to bind it securely to this provider.",
      );
    try {
      await update((d) => ({
        ...d,
        connections: [
          ...d.connections.filter((c) => c.id !== connection.id),
          { ...connection, credentialId: nextId },
        ],
        retiredCredentialIds: [
          ...(d.retiredCredentialIds || []),
          ...(previousId && previousId !== nextId ? [previousId] : []),
        ],
        defaultConnectionId: d.defaultConnectionId || connection.id,
      }));
    } catch (error) {
      if (key.trim()) await removeKey(nextId).catch(() => {});
      throw error;
    }
    await cleanupRetiredCredentials();
  };
  const deleteConnection = async (id: string) => {
    if (active.current)
      throw new Error(
        "Stop the current response before removing a connection.",
      );
    const removed = current.current.connections.find((c) => c.id === id);
    await update((d) => ({
      ...d,
      connections: d.connections.filter((c) => c.id !== id),
      retiredCredentialIds: [
        ...(d.retiredCredentialIds || []),
        ...(removed ? [removed.credentialId || removed.id] : []),
      ],
      defaultConnectionId:
        d.defaultConnectionId === id
          ? d.connections.find((c) => c.id !== id)?.id || ""
          : d.defaultConnectionId,
    }));
    await cleanupRetiredCredentials();
  };
  const send = async (
    conversationId: string,
    input: string,
    retry = false,
    onAccepted?: () => void,
  ) => {
    if (active.current)
      throw new Error(
        "Another response is running. Stop it before sending a new message.",
      );
    const conversation = current.current.conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) throw new Error("Conversation not found.");
    const connection = current.current.connections.find(
      (c) =>
        c.id ===
        (conversation.connectionId || current.current.defaultConnectionId),
    );
    if (!connection)
      throw new Error("Add or choose a connection in Settings first.");
    const destination = `${connection.protocol}:${connection.baseUrl}`;
    if (!consentedDestinations.current.has(destination)) {
      const allowed = await askPermission(
        "Share with your AI provider?",
        `This chat’s context will be sent to ${connection.name} at ${new URL(connection.baseUrl).host}. Agent chats also send that agent’s instructions and saved memories. The provider’s data policies and API charges apply.`,
        "Allow & send",
      );
      if (!allowed)
        throw new Error("Nothing was sent. Your message is ready to edit.");
      consentedDestinations.current.add(destination);
    }
    const key = await readKey(
      connection.credentialId || connection.id,
      credentialDestination(connection),
    );
    if (!key)
      throw new Error(
        "Add your API key in Settings. Browser preview keys must be re-entered after a reload.",
      );
    if (active.current)
      throw new Error(
        "Another response is running. Stop it before sending a new message.",
      );
    if (!retry && !input.trim()) return;
    const last = conversation.messages.at(-1);
    const messages =
      retry && last?.role === "assistant"
        ? conversation.messages.slice(0, -1)
        : [...conversation.messages];
    if (!retry)
      messages.push({
        id: uid(),
        role: "user",
        text: input.trim(),
        status: "complete",
        createdAt: Date.now(),
      });
    if (!contextMessages(messages).length || messages.at(-1)?.role !== "user")
      throw new Error("There is no message to retry.");
    const assistantId = uid();
    const controller = new AbortController();
    active.current = { controller, id: conversationId };
    setRunningId(conversationId);
    let pending = "";
    let lastFlush = Date.now();
    const checkpoints = createCheckpointBarrier(() => controller.abort());
    let accepted = false;
    const patch = async (
      delta:
        Record<string, unknown> | ((m: Message) => Record<string, unknown>),
    ) =>
      update((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        ...(typeof delta === "function" ? delta(m) : delta),
                      }
                    : m,
                ),
              }
            : c,
        ),
      }));
    const flush = () => {
      if (!pending) return Promise.resolve();
      const part = pending;
      pending = "";
      lastFlush = Date.now();
      return checkpoints.track(patch((m) => ({ text: m.text + part })));
    };
    const timeout = setTimeout(() => controller.abort(), 180000);
    const flushTimer = setInterval(flush, 200);
    try {
      await update((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                connectionId: connection.id,
                draft: !retry && c.draft === input ? "" : c.draft,
                title: c.messages.length ? c.title : conversationTitle(input),
                updatedAt: Date.now(),
                messages: [
                  ...messages,
                  {
                    id: assistantId,
                    role: "assistant",
                    text: "",
                    createdAt: Date.now(),
                    status: "streaming",
                    model: connection.model,
                  },
                ],
              }
            : c,
        ),
      }));
      accepted = true;
      onAccepted?.();
      const agent = current.current.agents.find(
        (a) => a.id === conversation.agentId,
      );
      await runAgent({
        connection,
        key,
        messages,
        instructions: systemPrompt(agent),
        useTools: !!agent,
        signal: controller.signal,
        fetcher: streamingFetch,
        onText: (text) => {
          pending += text;
          if (Date.now() - lastFlush > 100) flush();
        },
        onAction: (label) => {
          checkpoints.track(
            patch((m) => ({ actions: [...(m.actions || []), label] })),
          );
        },
        executeTool: async (call) => {
          if (!agent) throw new Error("No agent selected.");
          const args = JSON.parse(call.arguments);
          if (call.name !== "remember_fact" && call.name !== "forget_fact")
            throw new Error("Unsupported memory action.");
          const currentAgent = current.current.agents.find(
            (a) => a.id === agent.id,
          );
          const change =
            call.name === "remember_fact"
              ? args.text
              : currentAgent?.memories.find((m) => m.id === args.id)?.text;
          if (
            typeof change !== "string" ||
            !change.trim() ||
            change.length > 1000
          )
            throw new Error("Invalid memory change.");
          const allowed = await askPermission(
            call.name === "remember_fact"
              ? "Save this memory?"
              : "Forget this memory?",
            `${agent.name}: ${change}`,
            call.name === "remember_fact" ? "Save memory" : "Forget",
          );
          if (!allowed)
            return JSON.stringify({ approved: false, changed: false });
          if (controller.signal.aborted) throw new Error("Response stopped.");
          let output = "";
          await update((d) => ({
            ...d,
            agents: d.agents.map((a) => {
              if (a.id !== agent.id) return a;
              if (call.name === "remember_fact") {
                if (
                  typeof args.text !== "string" ||
                  !args.text.trim() ||
                  args.text.length > 1000
                )
                  throw new Error("Invalid memory.");
                const existing = a.memories.find(
                  (m) =>
                    m.text.toLowerCase() === args.text.trim().toLowerCase(),
                );
                if (existing) {
                  output = JSON.stringify({ saved: true, id: existing.id });
                  return a;
                }
                if (a.memories.length >= 50) throw new Error("Memory is full.");
                const memory = {
                  id: uid(),
                  text: args.text.trim(),
                  createdAt: Date.now(),
                };
                output = JSON.stringify({ saved: true, id: memory.id });
                return { ...a, memories: [...a.memories, memory] };
              }
              if (call.name === "forget_fact" && typeof args.id === "string") {
                if (a.memories.find((m) => m.id === args.id)?.text !== change)
                  throw new Error(
                    "This memory changed. Review it before trying again.",
                  );
                output = JSON.stringify({ forgotten: true });
                return {
                  ...a,
                  memories: a.memories.filter((m) => m.id !== args.id),
                };
              }
              throw new Error("Unsupported local tool.");
            }),
          }));
          return output;
        },
      });
      await flush();
      await checkpoints.finish();
      await patch({ status: "complete" });
    } catch (error) {
      if (!accepted) throw error;
      flush();
      await patch({
        status: controller.signal.aborted ? "interrupted" : "error",
        error: controller.signal.aborted
          ? "Response paused. Retry to make a new request; the partial answer is kept until then."
          : safeError(error, key),
      }).catch(() => {});
    } finally {
      clearTimeout(timeout);
      clearInterval(flushTimer);
      active.current = null;
      setRunningId(null);
    }
  };
  const importBackup = async (value: unknown) => {
    if (active.current)
      throw new Error("Stop the current response before restoring a backup.");
    const imported = parseData(value);
    const retired = [
      ...(current.current.retiredCredentialIds || []),
      ...current.current.connections.map((c) => c.credentialId || c.id),
    ];
    await update(() => ({
      ...imported,
      retiredCredentialIds: [...new Set(retired)],
    }));
    await cleanupRetiredCredentials();
  };
  return (
    <StoreContext.Provider
      value={{
        data,
        ready,
        storageError,
        runningId,
        update,
        newChat,
        saveAgent,
        saveConnection,
        deleteConnection,
        send,
        stop: () => active.current?.controller.abort(),
        importBackup,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
