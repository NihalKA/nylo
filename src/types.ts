export type Protocol = "openai" | "anthropic" | "compatible";
export type Connection = {
  id: string;
  name: string;
  protocol: Protocol;
  baseUrl: string;
  model: string;
};
export type Memory = { id: string; text: string; createdAt: number };
export type Agent = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  connectionId: string;
  color: string;
  memories: Memory[];
  createdAt: number;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  status: "complete" | "streaming" | "interrupted" | "error";
  error?: string;
  actions?: string[];
  model?: string;
};
export type Conversation = {
  id: string;
  title: string;
  agentId?: string;
  connectionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};
export type AppData = {
  version: 1;
  connections: Connection[];
  defaultConnectionId: string;
  agents: Agent[];
  conversations: Conversation[];
};
export const emptyData = (): AppData => ({
  version: 1,
  connections: [],
  defaultConnectionId: "",
  agents: [],
  conversations: [],
});
