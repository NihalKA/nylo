import test from "node:test";
import assert from "node:assert/strict";
import {
  runSDKAgent,
  connectionFetch,
  type SDKOptions,
} from "../src/sdk-engine";
import { connectionCapabilities } from "../src/capabilities";
import { emptyData, type Connection } from "../src/types";
import { parseData } from "../src/domain";
import {
  splitAttachmentStorage,
  hydrateAttachmentStorage,
} from "../src/attachment-storage";
const connection: Connection = {
  id: "qa",
  name: "QA",
  provider: "custom",
  protocol: "openai",
  baseUrl: "https://example.invalid/v1",
  model: "qa-model",
  imageModel: "qa-image",
};
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function stream(text?: string, name?: string, args: unknown = {}) {
  const item = name
    ? {
        type: "function_call",
        status: "completed",
        id: "fc_one",
        call_id: "call_one",
        name,
        arguments: JSON.stringify(args),
      }
    : {
        type: "message",
        id: "msg_one",
        role: "assistant",
        status: "completed",
        content: [],
      };
  const events: any[] = [
    {
      type: "response.created",
      response: { id: "resp_one", created_at: 1, model: "qa-model" },
    },
    { type: "response.output_item.added", output_index: 0, item },
  ];
  if (text)
    events.push({
      type: "response.output_text.delta",
      item_id: "msg_one",
      delta: text,
    });
  events.push(
    { type: "response.output_item.done", output_index: 0, item },
    {
      type: "response.completed",
      response: {
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
      },
    },
  );
  const wire = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const bytes = new TextEncoder().encode(wire);
  let index = 0;
  return new Response(
    new ReadableStream({
      pull(c) {
        if (index >= bytes.length) c.close();
        else {
          c.enqueue(bytes.slice(index, index + 17));
          index += 17;
        }
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}
function options(fetcher: typeof fetch): SDKOptions {
  return {
    connection,
    key: "synthetic-key",
    instructions: "test",
    messages: [
      {
        id: "user",
        role: "user",
        text: "test",
        status: "complete",
        createdAt: 1,
      },
    ],
    useTools: false,
    signal: new AbortController().signal,
    fetcher,
    onText: () => {},
    onAction: () => {},
    executeTool: async () => '{"changed":false}',
  };
}
test("SDK uses only the configured Responses destination, retains file bytes and store:false", async () => {
  let body: any;
  let output = "";
  const o = options(async (url, init) => {
    assert.equal(String(url), connection.baseUrl + "/responses");
    assert.equal(init?.redirect, "error");
    body = JSON.parse(String(init?.body));
    return stream("héllo");
  });
  o.messages[0].attachments = [
    {
      id: "pdf",
      name: "test.pdf",
      mimeType: "application/pdf",
      size: 8,
      data: "JVBERi0xLjc=",
    },
  ];
  o.onText = (t) => (output += t);
  await runSDKAgent(o);
  assert.equal(output, "héllo");
  assert.equal(body.store, false);
  assert.ok(JSON.stringify(body).includes("JVBERi0xLjc="));
  assert.equal(body.model, "qa-model");
});
test("SDK executes the memory tool once and returns its result before continuing", async () => {
  let n = 0,
    executions = 0;
  const o = options(async (_url, init) => {
    n++;
    const body = JSON.parse(String(init?.body));
    if (n === 1)
      return stream(undefined, "remember_fact", { text: "short answers" });
    assert.ok(JSON.stringify(body).includes("approved"));
    return stream("Done");
  });
  o.useTools = true;
  o.executeTool = async (call) => {
    executions++;
    assert.equal(call.name, "remember_fact");
    return '{"approved":false,"changed":false}';
  };
  await runSDKAgent(o);
  assert.equal(n, 2);
  assert.equal(executions, 1);
});
test("image tool generates once, persists a local file and returns metadata rather than pixels", async () => {
  let chats = 0,
    images = 0;
  let saved: any;
  const o = options(async (url, init) => {
    if (String(url).endsWith("/images/generations")) {
      images++;
      const b = JSON.parse(String(init?.body));
      assert.equal(b.model, "qa-image");
      return Response.json({ created: 1, data: [{ b64_json: png }] });
    }
    chats++;
    if (chats === 1)
      return stream(undefined, "generate_image", { prompt: "a cat" });
    assert.ok(!String(init?.body).includes(png));
    return stream("Here is your image.");
  });
  o.onFiles = async (files) => {
    saved = files[0];
  };
  await runSDKAgent(o);
  assert.equal(images, 1);
  assert.equal(saved.mimeType, "image/png");
  assert.equal(saved.data, png);
  const data = emptyData();
  data.connections = [connection];
  data.conversations = [
    {
      id: "chat",
      title: "test",
      connectionId: "qa",
      createdAt: 1,
      updatedAt: 1,
      messages: [
        {
          id: "answer",
          role: "assistant",
          text: "Image",
          createdAt: 1,
          status: "complete",
          generatedFiles: [saved],
        },
      ],
    },
  ];
  const split = splitAttachmentStorage(data);
  assert.ok(!split.metadata.includes(png));
  const restored = parseData(
    hydrateAttachmentStorage(JSON.parse(split.metadata), split.blobs),
    true,
  );
  assert.equal(
    restored.conversations[0].messages[0].generatedFiles?.[0].data,
    png,
  );
});
test("a denied image edit sends no image request", async () => {
  let chats = 0,
    images = 0;
  const o = options(async (url) => {
    if (String(url).includes("/images/")) {
      images++;
      throw Error("must not upload");
    }
    return ++chats === 1
      ? stream(undefined, "generate_image", {
          prompt: "make it green",
          imageId: "owned",
        })
      : stream("Not sent.");
  });
  o.messages[0].attachments = [
    {
      id: "owned",
      name: "owned.png",
      mimeType: "image/png",
      data: png,
      size: Buffer.from(png, "base64").length,
    },
  ];
  o.onFiles = async () => {};
  o.approveImageEdit = async () => false;
  await runSDKAgent(o);
  assert.equal(images, 0);
});
test("provider errors are not retried or copied to history", async () => {
  let calls = 0;
  const o = options(async () => {
    calls++;
    return new Response("secret provider body synthetic-key", { status: 429 });
  });
  await assert.rejects(
    runSDKAgent(o),
    (e) => !String(e).includes("synthetic-key"),
  );
  assert.equal(calls, 1);
});
test("unconfigured providers get no image/search tools and cannot leave their destination", async () => {
  assert.deepEqual(connectionCapabilities({ ...connection, imageModel: "" }), {
    imageModel: "",
    webSearch: false,
    images: false,
  });
  let calls = 0;
  const fetcher = connectionFetch(connection, async () => {
    calls++;
    return stream("ok");
  });
  await assert.rejects(fetcher("https://other.invalid/v1/responses"));
  await assert.rejects(fetcher(connection.baseUrl + "/models"));
  assert.equal(calls, 0);
});

test("offline device check exercises the real SDK without network", async () => {
  const { checkSDKOnDevice } = await import("../src/sdk-check");
  const result = await checkSDKOnDevice();
  assert.equal(result.mimeType, "image/png");
});

test("truncated streams preserve partial output and do not report success", async () => {
  let text = "";
  const o = options(
    async () =>
      new Response(
        'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"message","id":"msg_one"}}\n\ndata: {"type":"response.output_text.delta","item_id":"msg_one","delta":"partial"}\n\n',
        { headers: { "content-type": "text/event-stream" } },
      ),
  );
  o.onText = (t) => (text += t);
  await assert.rejects(runSDKAgent(o));
  assert.equal(text, "partial");
});
test("cancellation before starting sends nothing", async () => {
  let calls = 0;
  const o = options(async () => {
    calls++;
    return stream("wrong");
  });
  const controller = new AbortController();
  controller.abort();
  o.signal = controller.signal;
  await assert.rejects(runSDKAgent(o));
  assert.equal(calls, 0);
});

for (const protocol of ["compatible", "anthropic"] as const)
  test(`SDK preserves ${protocol} protocol and credentials`, async () => {
    let seen: any;
    let output = "";
    const o = options(async (url, init) => {
      seen = {
        url: String(url),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)),
      };
      const events =
        protocol === "compatible"
          ? [
              {
                id: "chat_one",
                object: "chat.completion.chunk",
                created: 1,
                model: "qa-model",
                choices: [
                  {
                    index: 0,
                    delta: { role: "assistant", content: "hello" },
                    finish_reason: null,
                  },
                ],
              },
              {
                id: "chat_one",
                object: "chat.completion.chunk",
                created: 1,
                model: "qa-model",
                choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
              },
            ]
          : [
              {
                type: "message_start",
                message: {
                  id: "msg_one",
                  type: "message",
                  role: "assistant",
                  model: "qa-model",
                  content: [],
                  stop_reason: null,
                  stop_sequence: null,
                  usage: { input_tokens: 1, output_tokens: 0 },
                },
              },
              {
                type: "content_block_start",
                index: 0,
                content_block: { type: "text", text: "" },
              },
              {
                type: "content_block_delta",
                index: 0,
                delta: { type: "text_delta", text: "hello" },
              },
              { type: "content_block_stop", index: 0 },
              {
                type: "message_delta",
                delta: { stop_reason: "end_turn", stop_sequence: null },
                usage: { output_tokens: 1 },
              },
              { type: "message_stop" },
            ];
      const wire =
        events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") +
        (protocol === "compatible" ? "data: [DONE]\n\n" : "");
      return new Response(wire, {
        headers: { "content-type": "text/event-stream" },
      });
    });
    o.connection = { ...connection, protocol, imageModel: "" };
    o.onText = (t) => (output += t);
    await runSDKAgent(o);
    assert.equal(output, "hello");
    assert.equal(
      seen.url,
      connection.baseUrl +
        (protocol === "compatible" ? "/chat/completions" : "/messages"),
    );
    assert.equal(
      seen.headers.get(
        protocol === "compatible" ? "authorization" : "x-api-key",
      ),
      protocol === "compatible" ? "Bearer synthetic-key" : "synthetic-key",
    );
  });

test("an incomplete tool response cannot execute memory or trigger another request", async () => {
  let calls = 0,
    executions = 0;
  const o = options(async () => {
    calls++;
    const response = stream(undefined, "remember_fact", {
      text: "must not save",
    });
    const wire = (await response.text()).replace(
      /data: \{"type":"response.completed"[^\n]+\n\n/,
      "",
    );
    return new Response(wire, {
      headers: { "content-type": "text/event-stream" },
    });
  });
  o.useTools = true;
  o.executeTool = async () => {
    executions++;
    return "{}";
  };
  await assert.rejects(runSDKAgent(o));
  assert.equal(executions, 0);
  assert.equal(calls, 1);
});

test("mobile Responses need not expose body streams or construct from streams", async () => {
  const OriginalResponse = globalThis.Response;
  class MobileResponse extends OriginalResponse {
    get body(): Response["body"] {
      return null;
    }
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      if (body instanceof ReadableStream)
        throw new Error("Native Response cannot construct from a stream");
      super(body, init);
    }
  }
  try {
    globalThis.Response = MobileResponse;
    const { checkSDKOnDevice } = await import("../src/sdk-check");
    const image = await checkSDKOnDevice();
    assert.equal(image.mimeType, "image/png");
  } finally {
    globalThis.Response = OriginalResponse;
  }
});

test("malformed image arguments never reach the image endpoint", async () => {
  for (const args of [
    {},
    { prompt: "   " },
    { prompt: 7 },
    { prompt: "x".repeat(6001) },
    { prompt: "a cat", imageId: 9 },
  ]) {
    let chats = 0;
    const o = options(async (url) => {
      assert.ok(
        String(url).endsWith("/responses"),
        "No image API call is permitted",
      );
      return ++chats === 1
        ? stream(undefined, "generate_image", args)
        : stream("The image arguments were invalid.");
    });
    o.onFiles = async () => {
      assert.fail("No file may be created");
    };
    await runSDKAgent(o);
    assert.equal(chats, 2);
  }
});

test("a document request calls the real local text writer and returns a file reference", async () => {
  let chats = 0;
  let saved: import("../src/types").Attachment | undefined;
  const o = options(async (url, init) => {
    assert.ok(
      String(url).endsWith("/responses"),
      "Document creation makes no extra provider/file request",
    );
    if (++chats === 1) {
      const request = JSON.parse(String(init?.body));
      assert.ok(
        request.tools.some(
          (t: { name: string }) => t.name === "create_document",
        ),
      );
      return stream(undefined, "create_document", {
        title: "Weather sample",
        format: "txt",
        content: "Synthetic sample: 25 C.",
      });
    }
    const request = JSON.parse(String(init?.body));
    const result = request.input.find(
      (x: { type: string }) => x.type === "function_call_output",
    );
    const output = JSON.parse(result.output);
    assert.equal(output.success, true);
    assert.equal(output.name, "Weather sample.txt");
    assert.ok(!result.output.includes("Synthetic sample"));
    return stream("Your file is ready.");
  });
  o.onFiles = async (files) => {
    saved = files[0];
  };
  await runSDKAgent(o);
  assert.equal(chats, 2);
  assert.equal(saved?.mimeType, "text/plain");
  assert.equal(saved?.data, "Synthetic sample: 25 C.");
});

test("invalid document arguments create no file and no additional API request", async () => {
  let chats = 0;
  const o = options(async (url) => {
    assert.ok(String(url).endsWith("/responses"));
    return ++chats === 1
      ? stream(undefined, "create_document", {
          title: "Report",
          format: "txt",
          content: "x".repeat(50001),
        })
      : stream("The document is too long.");
  });
  o.onFiles = async () => {
    assert.fail("Invalid document must not be saved");
  };
  await runSDKAgent(o);
  assert.equal(chats, 2);
});
