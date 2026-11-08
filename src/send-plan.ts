import { AppData, Message } from "./types";
import { selectedConnection } from "./model-library";
import { validateAttachments } from "./attachments";
import { contextMessages, systemPrompt, uid } from "./domain";
import { recentAgentContext, sharedContextPrompt } from "./agent-context";
import { preflightRequest } from "./providers";
// Pure prepare phase: validation must finish before permission, persistence or network effects.
export function prepareSend(
  data: AppData,
  id: string,
  input: string,
  retry = false,
  diagnostic = false,
) {
  const conversation = data.conversations.find((c) => c.id === id);
  if (!conversation) throw new Error("Conversation not found.");
  const saved = data.connections.find(
    (c) => c.id === (conversation.connectionId || data.defaultConnectionId),
  );
  if (!saved) throw new Error("Add or choose a connection in Settings first.");
  const connection = selectedConnection(saved, conversation.model);
  const attachments = validateAttachments(
    retry ? undefined : conversation.draftAttachments,
  );
  const last = conversation.messages.at(-1);
  const messages: Message[] = diagnostic
    ? []
    : retry && last?.role === "assistant"
      ? conversation.messages.slice(0, -1)
      : [...conversation.messages];
  if (!retry) {
    if (!input.trim() && !attachments.length)
      throw new Error("Write a message or choose an attachment.");
    messages.push({
      id: uid(),
      role: "user",
      text: input.trim(),
      attachments,
      status: "complete",
      createdAt: Date.now(),
    });
  }
  if (!contextMessages(messages).length || messages.at(-1)?.role !== "user")
    throw new Error("There is no message to retry.");
  const agent = data.agents.find((a) => a.id === conversation.agentId);
  const instructions =
    systemPrompt(agent) +
    (agent ? sharedContextPrompt(recentAgentContext(data, agent, id)) : "");
  preflightRequest(messages, instructions, connection.protocol);
  return {
    conversation,
    connection,
    attachments,
    messages,
    agent,
    instructions,
  };
}
