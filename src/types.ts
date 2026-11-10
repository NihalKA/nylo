export type Protocol = "openai" | "anthropic" | "compatible";
export type ProviderKind = "openai" | "anthropic" | "custom";
export type Connection = {
  id: string;
  name: string;
  protocol: Protocol;
  provider?: ProviderKind;
  credentialId?: string;
  baseUrl: string;
  model: string;
  models?: string[];
};
export type Attachment = {
  id: string;
  name: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf" | "text/plain";
  size: number;
  data: string;
};
export type Memory = { id: string; text: string; createdAt: number };
export type Agent = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  shareRecentChats?: boolean;
  goal?: string;
  workflow?: "direct" | "plan" | "coach";
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
  attachments?: Attachment[];
  model?: string;
};
export type Conversation = {
  id: string;
  title: string;
  draft?: string;
  draftAttachments?: Attachment[];
  model?: string;
  agentId?: string;
  connectionId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};
export type AppData = {
  version: 1;
  deviceCheck?: {
    agentId: string;
    streamChatId: string;
    recallChatId: string;
    connectionId: string;
    word: string;
    sessionId: string;
    createdAt: number;
    streamEvents?: number;
  };
  retiredCredentialIds?: string[];
  providerConsents?: {
    credentialId: string;
    destination: string;
    revision: 3;
    grantedAt: number;
    attachmentApprovals?: { conversationId: string; attachmentIds: string[] }[];
  }[];
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
