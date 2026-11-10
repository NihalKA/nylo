import test from "node:test";
import assert from "node:assert/strict";
import {
  validateAttachments,
  assertAttachmentProtocol,
  attachmentText,
} from "../src/attachments";
import {
  connectionModels,
  modelChoices,
  modelSections,
  selectedConnection,
} from "../src/model-library";
import { recentAgentContext, sharedContextPrompt } from "../src/agent-context";
import { buildRequest, preflightRequest, runAgent } from "../src/providers";
import { prepareSend } from "../src/send-plan";
import {
  splitAttachmentStorage,
  hydrateAttachmentStorage,
} from "../src/attachment-storage";
import {
  createConversation,
  parseData,
  reusableConversation,
  systemPrompt,
} from "../src/domain";
import { Agent, Attachment, Connection, emptyData } from "../src/types";
const connection: Connection = {
  id: "provider",
  name: "QA",
  protocol: "openai",
  provider: "custom",
  baseUrl: "https://example.com/v1",
  model: "one",
  models: ["one", "two"],
};
const photo: Attachment = {
  id: "image-one",
  name: "Owned QA.png",
  mimeType: "image/png",
  size: 8,
  data: "iVBORw0KGgo=",
};
const pdf: Attachment = {
  id: "pdf-one",
  name: "QA.pdf",
  mimeType: "application/pdf",
  size: 8,
  data: "JVBERi0xLjc=",
};
const text: Attachment = {
  id: "text-one",
  name: "QA.txt",
  mimeType: "text/plain",
  size: 5,
  data: "hello",
};
const agent: Agent = {
  id: "agent",
  name: "Guide",
  description: "Project guide",
  instructions: "Work carefully.",
  goal: "Ship my project",
  workflow: "plan",
  shareRecentChats: true,
  connectionId: connection.id,
  color: "#246B58",
  memories: [],
  createdAt: 1,
};
for (const protocol of ["openai", "anthropic", "compatible"] as const) {
  test(`${protocol}: follow-ups and retries retain original file bytes after native storage restoration`, () => {
    let data = emptyData();
    const selected = { ...connection, protocol };
    const files =
      protocol === "compatible" ? [photo, text] : [photo, pdf, text];
    data.connections = [selected];
    data.defaultConnectionId = selected.id;
    const chat = createConversation(selected.id);
    chat.draftAttachments = files;
    data.conversations = [chat];
    for (let turn = 0; turn < 3; turn++) {
      const plan = prepareSend(
        data,
        chat.id,
        turn ? "Explain another detail" : "Review these files",
      );
      const wireTurns = preflightRequest(
        plan.messages,
        plan.instructions,
        protocol,
      );
      assert.deepEqual(wireTurns[0].attachments, files);
      assert.equal(
        wireTurns.flatMap((m) => m.attachments || []).length,
        files.length,
      );
      const body = buildRequest(
        selected,
        wireTurns,
        plan.instructions,
        false,
      ).body;
      const encoded = JSON.stringify(body);
      for (const file of files)
        assert.ok(encoded.includes(file.data), file.name);
      const conversation = data.conversations[0];
      conversation.draftAttachments = [];
      conversation.messages = [
        ...plan.messages,
        {
          id: `reply-${turn}`,
          role: "assistant",
          text: "File analysis",
          status: "complete",
          createdAt: turn + 1,
        },
      ];
      const retry = prepareSend(data, chat.id, "", true);
      assert.deepEqual(retry.messages, plan.messages);
      assert.deepEqual(
        buildRequest(
          selected,
          preflightRequest(retry.messages, retry.instructions, protocol),
          retry.instructions,
          false,
        ).body,
        body,
      );
      // Both native platforms use this metadata/blob round trip on app restart.
      const saved = splitAttachmentStorage(data);
      data = parseData(
        hydrateAttachmentStorage(JSON.parse(saved.metadata), saved.blobs),
        true,
      );
      assert.deepEqual(data.conversations[0].messages[0].attachments, files);
    }
  });
}
test("legacy and multi-model providers preserve a default and route one selected model", () => {
  assert.deepEqual(connectionModels({ ...connection, models: undefined }), [
    "one",
  ]);
  assert.deepEqual(
    connectionModels({ ...connection, models: ["two", "two", " one "] }),
    ["one", "two"],
  );
  assert.equal(modelChoices([connection]).length, 2);
  const chosen = selectedConnection(connection, "two");
  assert.equal(
    buildRequest(chosen, [{ role: "user", text: "Hi" }], "", false).body.model,
    "two",
  );
  assert.equal(connection.model, "one");
  assert.throws(() => selectedConnection(connection, "removed"), /no longer/);
});
test("grouped model search keeps identical model IDs bound to distinct connections", () => {
  const other: Connection = {
    ...connection,
    id: "other-provider",
    name: "Second provider",
    baseUrl: "https://other.example/v1",
  };
  const providers = [connection, other];
  const original = JSON.stringify(providers);
  const sections = modelSections(providers, "  ONE  ");
  assert.deepEqual(
    sections.map((section) => ({
      connectionId: section.connection.id,
      models: section.data.map((item) => [item.id, item.model]),
    })),
    [
      { connectionId: "provider", models: [["provider:one", "one"]] },
      {
        connectionId: "other-provider",
        models: [["other-provider:one", "one"]],
      },
    ],
  );
  assert.deepEqual(
    modelSections(providers, "second").map((s) => s.key),
    ["other-provider"],
  );
  assert.deepEqual(modelSections(providers, "missing"), []);
  assert.equal(modelSections(providers)[0].data.length, 2);
  assert.equal(JSON.stringify(providers), original);
});
test("attachment validation rejects oversized, forged, duplicate and malformed content", () => {
  assert.equal(validateAttachments([photo, pdf, text]).length, 3);
  for (const bad of [
    { ...photo, size: 9 },
    { ...photo, data: "JVBERi0xLjc=" },
    { ...photo, data: "file:///private/secret" },
    { ...text, size: 3 },
    { ...text, data: "\u0000ello" },
  ])
    assert.throws(() => validateAttachments([bad]));
  assert.throws(() => validateAttachments([photo, photo]));
  assert.throws(() => validateAttachments(Array(5).fill(text)));
  assert.throws(() =>
    validateAttachments([{ ...text, data: "x".repeat(100001), size: 100001 }]),
  );
});
test("all protocols carry image pixels; Responses and Messages carry PDFs without remote upload", () => {
  const turns = [
    {
      role: "user" as const,
      text: "Review these",
      attachments: [photo, pdf, text],
    },
  ];
  const responses = buildRequest(connection, turns, "", false);
  const wire = JSON.stringify(responses.body);
  assert.match(wire, /input_image/);
  assert.match(wire, /input_file/);
  assert.match(wire, /data:application\/pdf;base64/);
  assert.match(wire, /hello/);
  const messages = JSON.stringify(
    buildRequest({ ...connection, protocol: "anthropic" }, turns, "", false)
      .body,
  );
  assert.match(messages, /"type":"document"/);
  assert.match(messages, /"media_type":"image\/png"/);
  assert.throws(
    () =>
      buildRequest({ ...connection, protocol: "compatible" }, turns, "", false),
    /PDFs need/,
  );
  const compatible = JSON.stringify(
    buildRequest(
      { ...connection, protocol: "compatible" },
      [{ ...turns[0], attachments: [photo, text] }],
      "",
      false,
    ).body,
  );
  assert.match(compatible, /image_url/);
  assert.match(compatible, /hello/);
  assert.doesNotMatch(wire, /file:\/\//);
});
test("text-file names and content reach context and the original message stays unchanged", () => {
  const original = { ...text };
  assert.match(
    attachmentText("Summarize", [text]),
    /QA.txt\n<file_content>\nhello/,
  );
  assert.deepEqual(text, original);
  assertAttachmentProtocol([text], "compatible");
});
test("recent context is opt-in, agent-scoped, excludes current chat and incomplete output", () => {
  const data = emptyData();
  const old = {
    ...createConversation(connection.id, agent.id),
    id: "old",
    title: "Prior work",
    messages: [
      {
        id: "m",
        role: "user" as const,
        text: "Project deadline is Friday",
        createdAt: 1,
        status: "complete" as const,
      },
      {
        id: "bad",
        role: "assistant" as const,
        text: "INTERRUPTED SECRET",
        createdAt: 2,
        status: "interrupted" as const,
      },
    ],
  };
  data.conversations = [
    old,
    {
      ...old,
      id: "current",
      messages: [{ ...old.messages[0], text: "CURRENT" }],
    },
    {
      ...old,
      id: "foreign",
      agentId: "other",
      messages: [{ ...old.messages[0], text: "OTHER AGENT" }],
    },
    {
      ...old,
      id: "personal",
      agentId: undefined,
      messages: [{ ...old.messages[0], text: "PERSONAL" }],
    },
  ];
  const context = recentAgentContext(data, agent, "current");
  assert.match(context, /deadline is Friday/);
  assert.doesNotMatch(
    context,
    /CURRENT|OTHER AGENT|PERSONAL|INTERRUPTED SECRET/,
  );
  assert.equal(
    recentAgentContext(data, { ...agent, shareRecentChats: false }, "current"),
    "",
  );
  data.conversations = [];
  assert.equal(recentAgentContext(data, agent, "current"), "");
  assert.match(
    sharedContextPrompt(context),
    /bounded excerpts, not complete history/,
  );
});
test("recent context is bounded even with very long older messages", () => {
  const data = emptyData();
  data.conversations = Array.from({ length: 20 }, (_, i) => ({
    ...createConversation("provider", "agent"),
    id: `chat-${i}`,
    messages: [
      {
        id: `message-${i}`,
        role: "user" as const,
        text: "x".repeat(20000),
        status: "complete" as const,
        createdAt: i,
      },
    ],
  }));
  assert.ok(recentAgentContext(data, agent, "current").length <= 12014);
});
test("local restoration keeps model library, goal, attachments and draft while imports cannot authorize recent-chat sharing", () => {
  const data = emptyData();
  data.connections = [connection];
  data.defaultConnectionId = connection.id;
  data.agents = [agent];
  data.conversations = [
    {
      ...createConversation(connection.id, agent.id),
      model: "two",
      draft: "Keep this",
      draftAttachments: [photo],
      messages: [
        {
          id: "message",
          role: "user",
          text: "Review",
          attachments: [pdf, text],
          status: "complete",
          createdAt: 1,
        },
      ],
    },
  ];
  const local = parseData(JSON.parse(JSON.stringify(data)), true);
  assert.equal(local.agents[0].shareRecentChats, true);
  assert.equal(local.agents[0].goal, agent.goal);
  assert.equal(local.conversations[0].model, "two");
  assert.deepEqual(local.conversations[0].draftAttachments, [photo]);
  assert.deepEqual(local.connections[0].models, ["one", "two"]);
  const imported = parseData(data);
  assert.equal(imported.agents[0].shareRecentChats, false);
  assert.deepEqual(imported.conversations[0].messages[0].attachments, [
    pdf,
    text,
  ]);
  assert.equal(
    reusableConversation(
      {
        ...data,
        conversations: [
          { ...createConversation("provider"), draftAttachments: [photo] },
        ],
      },
      "provider",
    ),
    undefined,
  );
});
test("agent prompt supports context, useful memory proposals and safety without claiming unsupported tools", () => {
  const prompt = systemPrompt(agent);
  assert.match(prompt, /Ship my project/);
  assert.match(prompt, /actionable plan/);
  assert.match(prompt, /Every save requires/);
  assert.match(prompt, /no browser/);
  assert.match(prompt, /Refuse assistance/);
});
test("streaming adapter transmits selected model and attached content once, with no separate file upload", async () => {
  let requests = 0;
  await runAgent({
    connection: selectedConnection(connection, "two"),
    key: "private-test",
    instructions: "Review the image",
    messages: [
      {
        id: "message",
        role: "user",
        text: "Describe",
        attachments: [photo],
        status: "complete",
        createdAt: 1,
      },
    ],
    useTools: false,
    maxOutputTokens: 128,
    signal: new AbortController().signal,
    onText: () => {},
    onAction: () => {},
    executeTool: async () => "",
    fetcher: (async (url, options) => {
      requests++;
      assert.equal(url, "https://example.com/v1/responses");
      const body = JSON.parse(options!.body as string);
      assert.equal(body.model, "two");
      assert.equal(body.max_output_tokens, 128);
      assert.match(JSON.stringify(body.input), /input_image/);
      assert.equal(body.store, false);
      return new Response(
        'data: {"type":"response.output_text.delta","delta":"A sample image"}\n\ndata: {"type":"response.completed"}\n\n',
      );
    }) as typeof fetch,
  });
  assert.equal(requests, 1);
});

test("older sharing approval cannot authorize the expanded data scope", () => {
  const data = emptyData();
  const raw = {
    ...data,
    providerConsents: [
      {
        credentialId: "key",
        destination: "https://example.com/v1",
        revision: 2,
        grantedAt: 1,
      },
    ],
  };
  assert.deepEqual(parseData(raw, true).providerConsents, []);
});
