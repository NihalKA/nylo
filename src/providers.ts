import { Connection, Message, Protocol } from "./types";
import { EventDecoder } from "./sse";
import { contextMessages } from "./domain";

export type ToolCall = { id: string; name: string; arguments: string };
export type WireTurn = {
  role: "user" | "assistant" | "tool";
  text: string;
  calls?: ToolCall[];
  callId?: string;
};
export const memoryTools = [
  {
    name: "remember_fact",
    description:
      "Save a durable fact in this agent’s local memory, only when the user explicitly asks you to remember it. Never save credentials.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "A concise fact, up to 1000 characters.",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
  {
    name: "forget_fact",
    description:
      "Delete one of this agent’s saved memories by its ID, only when the user asks you to forget it.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
];

export function buildRequest(
  connection: Connection,
  turns: WireTurn[],
  instructions: string,
  useTools: boolean,
) {
  const base = connection.baseUrl.replace(/\/+$/, "");
  if (connection.protocol === "openai") {
    const input = turns.flatMap((t) => {
      if (t.role === "tool")
        return [
          { type: "function_call_output", call_id: t.callId, output: t.text },
        ];
      const items: Record<string, unknown>[] = t.text
        ? [{ role: t.role, content: t.text }]
        : [];
      for (const c of t.calls ?? [])
        items.push({
          type: "function_call",
          call_id: c.id,
          name: c.name,
          arguments: c.arguments,
        });
      return items;
    });
    return {
      url: `${base}/responses`,
      body: {
        model: connection.model,
        instructions,
        input,
        store: false,
        max_output_tokens: 4096,
        stream: true,
        ...(useTools
          ? {
              tools: memoryTools.map((t) => ({
                type: "function",
                ...t,
                strict: true,
              })),
            }
          : {}),
      },
    };
  }
  if (connection.protocol === "anthropic") {
    const messages = turns.map((t) => {
      if (t.role === "tool")
        return {
          role: "user",
          content: [
            { type: "tool_result", tool_use_id: t.callId, content: t.text },
          ],
        };
      return {
        role: t.role,
        content: [
          ...(t.text ? [{ type: "text", text: t.text }] : []),
          ...(t.calls ?? []).map((c) => ({
            type: "tool_use",
            id: c.id,
            name: c.name,
            input: JSON.parse(c.arguments),
          })),
        ],
      };
    });
    return {
      url: `${base}/messages`,
      body: {
        model: connection.model,
        system: instructions,
        messages,
        max_tokens: 4096,
        stream: true,
        ...(useTools
          ? {
              tools: memoryTools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.parameters,
              })),
            }
          : {}),
      },
    };
  }
  const messages: Record<string, unknown>[] = [
    { role: "system", content: instructions },
    ...turns.map((t) =>
      t.role === "tool"
        ? { role: "tool", tool_call_id: t.callId, content: t.text }
        : {
            role: t.role,
            content: t.text || null,
            ...(t.calls?.length
              ? {
                  tool_calls: t.calls.map((c) => ({
                    id: c.id,
                    type: "function",
                    function: { name: c.name, arguments: c.arguments },
                  })),
                }
              : {}),
          },
    ),
  ];
  return {
    url: `${base}/chat/completions`,
    body: {
      model: connection.model,
      messages,
      max_tokens: 4096,
      stream: true,
      ...(useTools
        ? { tools: memoryTools.map((t) => ({ type: "function", function: t })) }
        : {}),
    },
  };
}

export async function consumeStream(
  response: Response,
  protocol: Protocol,
  onText: (text: string) => void,
) {
  const calls = new Map<number, ToolCall>();
  let complete = false;
  let text = "";
  const append = (delta: unknown) => {
    if (typeof delta === "string") {
      text += delta;
      onText(delta);
    }
  };
  const decoder = new EventDecoder(({ data }) => {
    if (data === "[DONE]") {
      complete = true;
      return;
    }
    const e = JSON.parse(data);
    if (e.type === "error" || e.error)
      throw new Error(
        e.error?.message || e.message || "The provider returned an error.",
      );
    if (protocol === "openai") {
      if (
        e.type === "response.output_text.delta" ||
        e.type === "response.refusal.delta"
      )
        append(e.delta);
      if (
        e.type === "response.output_item.added" &&
        e.item?.type === "function_call"
      )
        calls.set(e.output_index, {
          id: e.item.call_id,
          name: e.item.name,
          arguments: e.item.arguments || "",
        });
      if (e.type === "response.function_call_arguments.delta") {
        const c = calls.get(e.output_index);
        if (c) c.arguments += e.delta;
      }
      if (
        e.type === "response.output_item.done" &&
        e.item?.type === "function_call"
      )
        calls.set(e.output_index, {
          id: e.item.call_id,
          name: e.item.name,
          arguments: e.item.arguments,
        });
      if (e.type === "response.completed") complete = true;
      if (e.type === "response.failed" || e.type === "response.incomplete")
        throw new Error(
          e.response?.error?.message ||
            "The provider could not finish this response. Try a shorter request.",
        );
    } else if (protocol === "anthropic") {
      if (e.type === "content_block_delta" && e.delta?.type === "text_delta")
        append(e.delta.text);
      if (
        e.type === "content_block_start" &&
        e.content_block?.type === "tool_use"
      )
        calls.set(e.index, {
          id: e.content_block.id,
          name: e.content_block.name,
          arguments: Object.keys(e.content_block.input ?? {}).length
            ? JSON.stringify(e.content_block.input)
            : "",
        });
      if (
        e.type === "content_block_delta" &&
        e.delta?.type === "input_json_delta"
      ) {
        const c = calls.get(e.index);
        if (c) c.arguments += e.delta.partial_json;
      }
      if (e.type === "message_delta" && e.delta?.stop_reason === "max_tokens")
        throw new Error(
          "The response reached the output limit. Ask for a shorter answer.",
        );
      if (e.type === "message_stop") complete = true;
    } else {
      const choice = e.choices?.[0];
      append(choice?.delta?.content);
      for (const part of choice?.delta?.tool_calls ?? []) {
        const c = calls.get(part.index) ?? { id: "", name: "", arguments: "" };
        if (part.id) c.id = part.id;
        if (part.function?.name) c.name += part.function.name;
        c.arguments += part.function?.arguments || "";
        calls.set(part.index, c);
      }
      if (choice?.finish_reason === "length")
        throw new Error(
          "The response reached the output limit. Ask for a shorter answer.",
        );
      if (choice?.finish_reason) complete = true;
    }
  });
  if (!response.body)
    throw new Error("The provider did not return a readable response stream.");
  const reader = response.body.getReader();
  const utf8 = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      decoder.push(utf8.decode(value, { stream: true }));
    }
    decoder.push(utf8.decode());
    decoder.finish();
    if (!complete)
      throw new Error(
        "Connection ended before the response finished. Your partial answer is saved.",
      );
    return { text, calls: [...calls.values()] };
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function safeError(error: unknown, key: string) {
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong. Please try again.";
  return (key ? message.split(key).join("[redacted]") : message).slice(0, 600);
}

export async function runAgent(options: {
  connection: Connection;
  key: string;
  instructions: string;
  messages: Message[];
  useTools: boolean;
  signal: AbortSignal;
  fetcher: typeof fetch;
  onText: (delta: string) => void;
  onAction: (label: string) => void;
  executeTool: (call: ToolCall) => Promise<string>;
}) {
  const {
    connection,
    key,
    instructions,
    useTools,
    signal,
    fetcher,
    onText,
    onAction,
    executeTool,
  } = options;
  const turns: WireTurn[] = contextMessages(options.messages).map((m) => ({
    role: m.role,
    text: m.text,
  }));
  if (
    instructions.length +
      turns.reduce((size, turn) => size + turn.text.length, 0) >
    80000
  )
    throw new Error(
      "This conversation is too long to send safely. Start a new chat; agent chats keep their saved memories.",
    );
  // Bound the local tool loop so a malformed model cannot run indefinitely.
  for (let step = 0; step < 5; step++) {
    if (signal.aborted) throw new Error("Response stopped.");
    const request = buildRequest(connection, turns, instructions, useTools);
    const response = await fetcher(request.url, {
      method: "POST",
      redirect: "error",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(connection.protocol === "anthropic"
          ? {
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
              "anthropic-dangerous-direct-browser-access": "true",
            }
          : { Authorization: `Bearer ${key}` }),
      },
      body: JSON.stringify(request.body),
    });
    if (!response.ok) {
      // Do not put request headers, keys, or a provider's raw error response in logs or persisted history.
      const descriptions: Record<number, string> = {
        401: "The API key was rejected. Check your connection in Settings.",
        403: "This key does not have access to the selected model.",
        404: "The model or API endpoint was not found. Check the model ID and base URL.",
        429: "The provider rate limit or account quota was reached. Check your provider account and retry later.",
      };
      throw new Error(
        descriptions[response.status] ||
          `The provider returned HTTP ${response.status}. Check the connection and try again.`,
      );
    }
    const result = await consumeStream(response, connection.protocol, onText);
    if (!result.calls.length) {
      if (!result.text.trim())
        throw new Error(
          "The provider returned no text. This model may require a different API or configuration.",
        );
      return;
    }
    if (!useTools) throw new Error("This chat has no tools enabled.");
    turns.push({ role: "assistant", text: result.text, calls: result.calls });
    for (const call of result.calls) {
      if (signal.aborted) throw new Error("Response stopped.");
      let output: string;
      try {
        output = await executeTool(call);
        const outcome = JSON.parse(output) as { changed?: boolean };
        const changed = outcome.changed !== false;
        onAction(
          changed
            ? call.name === "remember_fact"
              ? "Saved a memory"
              : "Updated memory"
            : "Memory unchanged",
        );
      } catch {
        output = JSON.stringify({
          error:
            "The local memory action could not be completed. Check the arguments and ask the user to review memory.",
        });
      }
      turns.push({ role: "tool", text: output, callId: call.id });
    }
    if (result.text) onText("\n\n");
  }
  throw new Error(
    "The agent reached its local step limit. Saved memory changes are kept. Please send a new message to continue.",
  );
}
