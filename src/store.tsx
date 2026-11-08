import { recentAgentContext, sharedContextPrompt } from "./agent-context";
import { selectedConnection } from "./model-library";
import { assertAttachmentProtocol, validateAttachments } from "./attachments";
import { credentialDestination, stageCredential } from "./credentials";
import {
  createCheckpointBarrier,
  createDurableUpdater,
  createSerialExecutor,
} from "./persistence";
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
  isDeviceCheckConversation,
  reusableConversation,
} from "./domain";
import { readData, readKey, removeKey, writeData, writeKey } from "./storage";
import { runAgent, safeError } from "./providers";
import { streamingFetch } from "./transport";

type AgentDraft = Omit<Agent, "id" | "createdAt" | "memories">;
type SendOptions = {
  deviceCheck: true;
  maxOutputTokens: number;
  tools: false;
  onText?: () => void;
};
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
    initialContext?: string,
  ) => Promise<string>;
  saveConnection: (connection: Connection, key: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  send: (
    conversationId: string,
    text: string,
    retry?: boolean,
    onAccepted?: () => void,
    options?: SendOptions,
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
  const stagingCredentials = useRef(new Set<string>());
  const credentialOperations = useRef(createSerialExecutor());
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
      if (!activeIds.has(id) && !stagingCredentials.current.has(id)) {
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
    if (ready)
      void credentialOperations
        .current(cleanupRetiredCredentials)
        .catch(() => {});
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
    if (agentId && agentId === current.current.deviceCheck?.agentId)
      throw new Error("Use Live device check to run this test agent.");
    const agent = current.current.agents.find((a) => a.id === agentId);
    const connectionId =
      agent?.connectionId || current.current.defaultConnectionId;
    const blank = reusableConversation(current.current, connectionId, agentId);
    if (blank) return blank.id;
    const conversation = createConversation(connectionId, agentId);
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
    initialContext = "",
  ) => {
    if (id && id === current.current.deviceCheck?.agentId)
      throw new Error("This agent belongs to Live device check.");
    if (fromChat && isDeviceCheckConversation(current.current, fromChat))
      throw new Error(
        "Test conversations cannot be converted to ordinary agents.",
      );
    if (!draft.name.trim()) throw new Error("Give your agent a name.");
    if (fromChat) {
      let created = "";
      await update((d) => {
        const next = promoteConversation(d, fromChat, draft, initialContext);
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
  const saveConnection = (input: Connection, key: string) =>
    credentialOperations.current(async () => {
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
      if (
        !key.trim() &&
        !(await readKey(nextId, credentialDestination(connection)))
      )
        throw new Error(
          "Re-enter your API key to bind it securely to this provider.",
        );
      const activate = async () => {
        await update((d) => ({
          ...d,
          connections: [
            ...d.connections.filter((c) => c.id !== connection.id),
            { ...connection, credentialId: nextId },
          ],
          retiredCredentialIds: [
            ...(d.retiredCredentialIds || []).filter((id) => id !== nextId),
            ...(previousId && previousId !== nextId ? [previousId] : []),
          ],
          providerConsents: (d.providerConsents || []).filter(
            (c) =>
              !previousId ||
              previousId === nextId ||
              c.credentialId !== previousId,
          ),
          defaultConnectionId: d.defaultConnectionId || connection.id,
        }));
      };
      if (key.trim()) {
        stagingCredentials.current.add(nextId);
        try {
          await stageCredential({
            journal: () =>
              update((d) => ({
                ...d,
                retiredCredentialIds: [
                  ...(d.retiredCredentialIds || []),
                  nextId,
                ],
              })),
            write: () =>
              writeKey(nextId, key.trim(), credentialDestination(connection)),
            activate,
            rollback: () => removeKey(nextId),
          });
        } finally {
          stagingCredentials.current.delete(nextId);
        }
      } else {
        await activate();
      }
      await cleanupRetiredCredentials();
    });
  const deleteConnection = (id: string) =>
    credentialOperations.current(async () => {
      if (active.current)
        throw new Error(
          "Stop the current response before removing a connection.",
        );
      const removed = current.current.connections.find((c) => c.id === id);
      await update((d) => ({
        ...d,
        connections: d.connections.filter((c) => c.id !== id),
        providerConsents: (d.providerConsents || []).filter(
          (c) => c.credentialId !== (removed?.credentialId || removed?.id),
        ),
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
    });
  const send = async (
    conversationId: string,
    input: string,
    retry = false,
    onAccepted?: () => void,
    options?: SendOptions,
  ) => {
    const reserved = isDeviceCheckConversation(current.current, conversationId);
    if (reserved !== !!options?.deviceCheck)
      throw new Error("Run test conversations only from Live device check.");
    if (active.current)
      throw new Error(
        "Another response is running. Stop it before sending a new message.",
      );
    const conversation = current.current.conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) throw new Error("Conversation not found.");
    const savedConnection = current.current.connections.find(
      (c) =>
        c.id ===
        (conversation.connectionId || current.current.defaultConnectionId),
    );
    const connection = savedConnection
      ? selectedConnection(savedConnection, conversation.model)
      : undefined;
    if (!connection)
      throw new Error("Add or choose a connection in Settings first.");
    const attachments = validateAttachments(
      retry ? undefined : conversation.draftAttachments,
    );
    const previousAttachments = conversation.messages.flatMap(
      (m) => m.attachments || [],
    );
    assertAttachmentProtocol(
      [...previousAttachments, ...attachments],
      connection.protocol,
    );
    if (attachments.length || previousAttachments.length) {
      if (
        !(await askPermission(
          "Send attached content?",
          `Attached content (${[...previousAttachments, ...attachments]
            .map((a) => a.name)
            .join(", ")
            .slice(
              0,
              600,
            )}) will be sent with this conversation to ${connection.name} at ${new URL(connection.baseUrl).host}, using ${connection.model}. Attachments may include private information and are included in future messages in this chat. Provider charges and data policies apply.`,
          "Send attachments",
        ))
      )
        throw new Error(
          "Nothing was sent. Your draft and attachments are kept.",
        );
    }
    const destination = credentialDestination(connection);
    const credentialId = connection.credentialId || connection.id;
    if (
      !(current.current.providerConsents || []).some(
        (c) =>
          c.credentialId === credentialId &&
          c.destination === destination &&
          c.revision === 3,
      )
    ) {
      const allowed = await askPermission(
        "Share with your AI provider?",
        `Allow Nylo to send conversations to ${connection.name} at ${new URL(connection.baseUrl).host}? This approval is remembered for all chats using this connection. Agent chats also send that agent’s instructions, saved memories and, if enabled, recent chats from that same agent. The provider’s data policies and API charges apply. Reset sharing approval in AI providers at any time.`,
        "Allow & send",
      );
      if (!allowed)
        throw new Error("Nothing was sent. Your message is ready to edit.");
      await update((d) => ({
        ...d,
        providerConsents: [
          ...(d.providerConsents || []).filter(
            (c) => c.credentialId !== credentialId,
          ),
          { credentialId, destination, revision: 3, grantedAt: Date.now() },
        ],
      }));
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
    if (!retry && !input.trim() && !attachments.length) return;
    const last = conversation.messages.at(-1);
    const messages = options?.deviceCheck
      ? []
      : retry && last?.role === "assistant"
        ? conversation.messages.slice(0, -1)
        : [...conversation.messages];
    if (!retry)
      messages.push({
        id: uid(),
        role: "user",
        text: input.trim(),
        attachments,
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
        deviceCheck:
          options?.deviceCheck && d.deviceCheck?.streamChatId === conversationId
            ? { ...d.deviceCheck, streamEvents: undefined }
            : d.deviceCheck,
        conversations: d.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                connectionId: connection.id,
                draft: !retry && c.draft === input ? "" : c.draft,
                draftAttachments: !retry ? [] : c.draftAttachments,
                title: c.messages.length
                  ? c.title
                  : conversationTitle(
                      input || attachments[0]?.name || "Attachment",
                    ),
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
        instructions:
          systemPrompt(agent) +
          (agent
            ? sharedContextPrompt(
                recentAgentContext(current.current, agent, conversationId),
              )
            : ""),
        useTools: !!agent && options?.tools !== false,
        maxOutputTokens: options?.maxOutputTokens,
        signal: controller.signal,
        fetcher: streamingFetch,
        onText: (text) => {
          options?.onText?.();
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
  const importBackup = (value: unknown) =>
    credentialOperations.current(async () => {
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
    });
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
