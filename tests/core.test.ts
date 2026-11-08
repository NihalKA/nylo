import { test } from "node:test";
import assert from "node:assert/strict";
import { EventDecoder } from "../src/sse";
import {
  contextMessages,
  createConversation,
  parseData,
  promoteConversation,
  recoverInterrupted,
  systemPrompt,
  validateConnection,
} from "../src/domain";
import {
  buildRequest,
  consumeStream,
  runAgent,
  safeError,
} from "../src/providers";
import { Agent, Connection, Message, emptyData } from "../src/types";

const connection: Connection = {
  id: "provider-1",
  name: "Test",
  protocol: "openai",
  baseUrl: "https://api.openai.com/v1",
  model: "test-model",
};
const message = (
  role: "user" | "assistant",
  text: string,
  status: Message["status"] = "complete",
): Message => ({ id: `${role}-${text}`, role, text, status, createdAt: 1 });
const agent: Agent = {
  id: "agent-1",
  name: "Writer",
  description: "Writing partner",
  instructions: "Be clear.",
  connectionId: connection.id,
  color: "#246B58",
  memories: [{ id: "memory-1", text: "Use British English.", createdAt: 1 }],
  createdAt: 1,
};
function stream(events: unknown[], ending = true) {
  const payload = events
    .map(
      (e) => `data: ${typeof e === "string" ? e : JSON.stringify(e)}\r\n\r\n`,
    )
    .join("");
  const bytes = new TextEncoder().encode(payload);
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        // Exercise splits inside Unicode and protocol fields, not just at event boundaries.
        for (let i = 0; i < bytes.length; i += 7)
          controller.enqueue(bytes.slice(i, i + 7));
        if (ending) controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } },
  );
}

test("SSE handles CRLF split between chunks, comments, event names and multiline data", () => {
  const events: unknown[] = [];
  const decoder = new EventDecoder((e) => events.push(e));
  for (const char of ": ping\r\nevent: answer\r\ndata: first\r\ndata: second\r\n\r\ndata: final\n\n")
    decoder.push(char);
  decoder.finish();
  assert.deepEqual(events, [
    { event: "answer", data: "first\nsecond" },
    { event: "message", data: "final" },
  ]);
});
test("OpenAI streaming preserves split Unicode and checks completion", async () => {
  let result = "";
  await consumeStream(
    stream([
      { type: "response.output_text.delta", delta: "Hello 🌱" },
      { type: "response.completed" },
    ]),
    "openai",
    (x) => (result += x),
  );
  assert.equal(result, "Hello 🌱");
});
test("a truncated stream is an interruption, never a completed answer", async () => {
  let text = "";
  await assert.rejects(
    consumeStream(
      stream([{ type: "response.output_text.delta", delta: "Partial" }]),
      "openai",
      (x) => (text += x),
    ),
    /before the response finished/,
  );
  assert.equal(text, "Partial");
});
test("provider errors received after HTTP 200 fail the stream", async () => {
  await assert.rejects(
    consumeStream(
      stream([{ type: "error", error: { message: "Overloaded" } }]),
      "anthropic",
      () => {},
    ),
    /Overloaded/,
  );
});
test("OpenAI gathers streamed tool arguments using call_id", async () => {
  const result = await consumeStream(
    stream([
      {
        type: "response.output_item.added",
        output_index: 0,
        item: {
          type: "function_call",
          call_id: "call-1",
          name: "remember_fact",
          arguments: "",
        },
      },
      {
        type: "response.function_call_arguments.delta",
        output_index: 0,
        delta: '{"text":',
      },
      {
        type: "response.function_call_arguments.delta",
        output_index: 0,
        delta: '"Be concise"}',
      },
      { type: "response.completed" },
    ]),
    "openai",
    () => {},
  );
  assert.deepEqual(result.calls, [
    { id: "call-1", name: "remember_fact", arguments: '{"text":"Be concise"}' },
  ]);
});
test("Anthropic gathers text and input_json deltas", async () => {
  let text = "";
  const result = await consumeStream(
    stream([
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "text_delta", text: "Saved." },
      },
      {
        type: "content_block_start",
        index: 1,
        content_block: {
          type: "tool_use",
          id: "tool-1",
          name: "remember_fact",
          input: {},
        },
      },
      {
        type: "content_block_delta",
        index: 1,
        delta: {
          type: "input_json_delta",
          partial_json: '{"text":"British English"}',
        },
      },
      { type: "message_stop" },
    ]),
    "anthropic",
    (x) => (text += x),
  );
  assert.equal(text, "Saved.");
  assert.equal(JSON.parse(result.calls[0].arguments).text, "British English");
});
test("compatible streaming handles text and finish_reason", async () => {
  let text = "";
  await consumeStream(
    stream([
      { choices: [{ delta: { content: "Works" }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: "stop" }] },
      "[DONE]",
    ]),
    "compatible",
    (x) => (text += x),
  );
  assert.equal(text, "Works");
});
test("output length limits do not silently truncate answers", async () => {
  await assert.rejects(
    consumeStream(
      stream([
        {
          choices: [{ delta: { content: "Partial" }, finish_reason: "length" }],
        },
      ]),
      "compatible",
      () => {},
    ),
    /output limit/,
  );
});
test("requests use correct provider protocols; OpenAI storage is disabled", () => {
  const turns = [{ role: "user" as const, text: "Hello" }];
  const openai = buildRequest(connection, turns, "Instructions", false);
  assert.equal(openai.url, "https://api.openai.com/v1/responses");
  assert.equal((openai.body as any).store, false);
  assert.ok(!("tools" in openai.body));
  const claude = buildRequest(
    { ...connection, protocol: "anthropic" },
    turns,
    "Instructions",
    true,
  );
  assert.equal(claude.url, "https://api.openai.com/v1/messages");
  assert.equal((claude.body as any).system, "Instructions");
  const compatible = buildRequest(
    { ...connection, protocol: "compatible" },
    turns,
    "Instructions",
    false,
  );
  assert.equal(compatible.url, "https://api.openai.com/v1/chat/completions");
});
test("memory tool output is returned to the model and the final answer is streamed", async () => {
  let requests = 0;
  let executions = 0;
  let text = "";
  const actions: string[] = [];
  const fetcher = (async (_url: any, init: any) => {
    requests++;
    const body = JSON.parse(init.body);
    assert.equal(init.headers.Authorization, "Bearer synthetic-test-key");
    if (requests === 1)
      return stream([
        {
          type: "response.output_item.added",
          output_index: 0,
          item: {
            type: "function_call",
            call_id: "call-1",
            name: "remember_fact",
            arguments: '{"text":"Be concise"}',
          },
        },
        { type: "response.completed" },
      ]);
    assert.ok(
      body.input.some(
        (i: any) => i.type === "function_call_output" && i.call_id === "call-1",
      ),
    );
    return stream([
      { type: "response.output_text.delta", delta: "I will remember." },
      { type: "response.completed" },
    ]);
  }) as typeof fetch;
  await runAgent({
    connection,
    key: "synthetic-test-key",
    instructions: "Test",
    messages: [message("user", "Remember to be concise")],
    useTools: true,
    signal: new AbortController().signal,
    fetcher,
    onText: (x) => (text += x),
    onAction: (x) => actions.push(x),
    executeTool: async () => {
      executions++;
      return '{"saved":true}';
    },
  });
  assert.equal(requests, 2);
  assert.equal(executions, 1);
  assert.equal(text, "I will remember.");
  assert.deepEqual(actions, ["Saved a memory"]);
});
test("a normal chat never executes tools returned by a provider", async () => {
  let executed = false;
  await assert.rejects(
    runAgent({
      connection,
      key: "synthetic",
      instructions: "Test",
      messages: [message("user", "Hi")],
      useTools: false,
      signal: new AbortController().signal,
      fetcher: (async () =>
        stream([
          {
            type: "response.output_item.added",
            output_index: 0,
            item: {
              type: "function_call",
              call_id: "c",
              name: "remember_fact",
              arguments: "{}",
            },
          },
          { type: "response.completed" },
        ])) as typeof fetch,
      onText: () => {},
      onAction: () => {},
      executeTool: async () => {
        executed = true;
        return "{}";
      },
    }),
    /no tools/,
  );
  assert.equal(executed, false);
});
test("API failures expose useful messages without logging response bodies", async () => {
  await assert.rejects(
    runAgent({
      connection,
      key: "synthetic",
      instructions: "Test",
      messages: [message("user", "Hi")],
      useTools: false,
      signal: new AbortController().signal,
      fetcher: (async () =>
        new Response("synthetic secret returned by upstream", {
          status: 401,
        })) as typeof fetch,
      onText: () => {},
      onAction: () => {},
      executeTool: async () => "",
    }),
    /API key was rejected/,
  );
});
test("stopped runs never begin another network request", async () => {
  const controller = new AbortController();
  controller.abort();
  let requested = false;
  await assert.rejects(
    runAgent({
      connection,
      key: "synthetic",
      instructions: "Test",
      messages: [],
      useTools: false,
      signal: controller.signal,
      fetcher: (async () => {
        requested = true;
        return new Response();
      }) as typeof fetch,
      onText: () => {},
      onAction: () => {},
      executeTool: async () => "",
    }),
    /stopped/,
  );
  assert.equal(requested, false);
});
test("agent instructions include only that agent’s memory", () => {
  const prompt = systemPrompt(agent);
  assert.match(prompt, /British English/);
  assert.match(prompt, /Your name: Writer/);
  assert.doesNotMatch(systemPrompt(), /British English/);
});
test("promoting a chat preserves its ID, messages and connection", () => {
  const chat = createConversation(connection.id);
  chat.messages = [message("user", "My project")];
  const next = promoteConversation(
    { ...emptyData(), conversations: [chat] },
    chat.id,
    {
      name: "Guide",
      description: "Project guide",
      instructions: "Help me.",
      connectionId: connection.id,
      color: "#246B58",
    },
  );
  assert.equal(next.conversations.length, 1);
  assert.equal(next.conversations[0].id, chat.id);
  assert.equal(next.conversations[0].messages[0].text, "My project");
  assert.equal(next.conversations[0].agentId, next.agents[0].id);
});
test("reopening converts unfinished streams to interrupted state", () => {
  const chat = createConversation("p");
  chat.messages = [
    message("user", "Hi"),
    message("assistant", "Partial", "streaming"),
  ];
  const recovered = recoverInterrupted({
    ...emptyData(),
    conversations: [chat],
  });
  assert.equal(recovered.conversations[0].messages[1].status, "interrupted");
  assert.equal(recovered.conversations[0].messages[1].text, "Partial");
  assert.equal(contextMessages(recovered.conversations[0].messages).length, 1);
});
test("connection validation rejects unencrypted or credential-bearing URLs", () => {
  assert.throws(
    () =>
      validateConnection({ ...connection, baseUrl: "http://example.com/v1" }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      validateConnection({
        ...connection,
        baseUrl: "https://key:secret@example.com/v1",
      }),
    /credentials/,
  );
  assert.throws(
    () =>
      validateConnection({
        ...connection,
        baseUrl: "https://example.com/v1?key=secret",
      }),
    /credentials/,
  );
  assert.throws(
    () => validateConnection({ ...connection, model: " " }),
    /model ID/,
  );
  assert.equal(
    validateConnection({
      ...connection,
      baseUrl: "https://api.openai.com/v1/",
    }).baseUrl,
    connection.baseUrl,
  );
});
test("backups validate shape and strip injected API-key fields", () => {
  const imported = parseData({
    ...emptyData(),
    connections: [{ ...connection, apiKey: "must-not-be-saved" }],
    apiKey: "also-not-saved",
  });
  assert.doesNotMatch(JSON.stringify(imported), /must-not|also-not|apiKey/);
  assert.throws(() => parseData({ version: 2 }), /backup/);
  assert.throws(
    () => parseData({ ...emptyData(), agents: [{ id: "bad" }] }),
    /agent/,
  );
});
test("safe errors redact credentials", () => {
  assert.equal(
    safeError(new Error("Rejected synthetic-secret"), "synthetic-secret"),
    "Rejected [redacted]",
  );
});
