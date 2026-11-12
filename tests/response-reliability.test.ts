import test from "node:test";
import assert from "node:assert/strict";
import {
  createResponseClock,
  interruptionMessage,
  nextActionLabels,
} from "../src/response-progress";
import { sdkFailure, responseErrorCode } from "../src/sdk-errors";
import { prepareSend } from "../src/send-plan";
import { emptyData, Message } from "../src/types";

test("slow images have their own idle budget; activity never extends the total deadline", () => {
  let time = 0;
  const clock = createResponseClock(() => time);
  time = 119999;
  assert.equal(clock.expired(), undefined);
  clock.activity();
  time = 180000;
  assert.equal(clock.expired(), undefined);
  clock.enter("image");
  time = 400000;
  assert.equal(clock.expired(), undefined);
  time = 480000;
  assert.equal(clock.expired(), "stage-timeout");
  clock.activity();
  time = 599999;
  assert.equal(clock.expired(), undefined);
  time = 600000;
  assert.equal(clock.expired(), "total-timeout");
});
test("background expiry, user stop and idle timeout explain different causes", () => {
  assert.match(interruptionMessage("background-expired", "image"), /iOS ended/);
  assert.match(interruptionMessage("stopped", "image"), /You stopped/);
  assert.match(interruptionMessage("stage-timeout", "image"), /300 seconds/);
  assert.match(interruptionMessage("stage-timeout", "model"), /120 seconds/);
  assert.deepEqual(nextActionLabels(["Creating image…"], "Image created"), [
    "Image created",
  ]);
});
test("repeated text retries preserve interrupted files and partial text without resending pixels", () => {
  const d = emptyData();
  d.connections = [
    {
      provider: "custom",
      id: "p",
      name: "P",
      baseUrl: "https://example.invalid/v1",
      protocol: "openai",
      model: "m",
    },
  ];
  d.defaultConnectionId = "p";
  const user: Message = {
    id: "u",
    role: "user",
    text: "Create an image",
    status: "complete",
    createdAt: 1,
  };
  const output: Message = {
    id: "a",
    role: "assistant",
    text: "Partial reply",
    status: "interrupted",
    createdAt: 2,
    generatedFiles: [
      {
        id: "f",
        name: "Image.png",
        mimeType: "image/png",
        data: "iVBORw0KGgo=",
        size: 8,
      },
    ],
  };
  d.conversations = [
    {
      id: "c",
      title: "C",
      connectionId: "p",
      createdAt: 1,
      updatedAt: 2,
      messages: [user, output],
    },
  ];
  for (let n = 0; n < 2; n++) {
    const plan = prepareSend(d, "c", "", true);
    assert.deepEqual(plan.messages, [user]);
    assert.equal(plan.retryFiles.length, 1);
    assert.equal(plan.preservedReplies[0].id, "a");
    assert.equal(plan.preservedReplies[0].text, "Partial reply");
    assert.match(plan.instructions, /retries only the unfinished text reply/);
    assert.ok(!plan.instructions.includes("iVBORw0KGgo="));
    d.conversations[0].messages = [
      ...plan.messages,
      ...plan.preservedReplies,
      {
        id: "r" + n,
        role: "assistant",
        text: "",
        status: "error",
        createdAt: 3 + n,
      },
    ];
  }
});
test("diagnostics expose safe codes but never arbitrary provider text, keys or URLs", async () => {
  const error = {
    name: "AI_APICallError",
    statusCode: 400,
    message: "secret-key https://private.invalid",
    data: { error: { code: "unsupported_parameter", message: "secret-key" } },
  };
  const text = sdkFailure(error, "image").message;
  assert.match(text, /HTTP 400; unsupported_parameter/);
  assert.ok(!text.includes("secret-key") && !text.includes("private.invalid"));
  const unknown = sdkFailure(
    { name: "secret-key", code: "secret-key", message: "secret-key" },
    "model",
  ).message;
  assert.ok(!unknown.includes("secret-key"));
  assert.equal(
    await responseErrorCode(
      Response.json({
        error: { code: "invalid_request_error", message: "secret-key" },
      }),
    ),
    "invalid_request_error",
  );
  assert.equal(
    await responseErrorCode(new Response("x".repeat(9000))),
    undefined,
  );
});

test("cold restart preserves an interrupted generated file for reply-only retry", async () => {
  const { splitAttachmentStorage, hydrateAttachmentStorage } =
    await import("../src/attachment-storage");
  const { parseData, recoverInterrupted } = await import("../src/domain");
  const d = emptyData();
  d.connections = [
    {
      provider: "custom",
      id: "p",
      name: "P",
      baseUrl: "https://example.invalid/v1",
      protocol: "openai",
      model: "m",
    },
  ];
  d.defaultConnectionId = "p";
  d.conversations = [
    {
      id: "c",
      title: "C",
      connectionId: "p",
      createdAt: 1,
      updatedAt: 2,
      messages: [
        {
          id: "u",
          role: "user",
          text: "Create an image",
          status: "complete",
          createdAt: 1,
        },
        {
          id: "a",
          role: "assistant",
          text: "",
          status: "streaming",
          createdAt: 2,
          generatedFiles: [
            {
              id: "f",
              name: "Saved.png",
              mimeType: "image/png",
              data: "iVBORw0KGgo=",
              size: 8,
            },
          ],
        },
      ],
    },
  ];
  const saved = splitAttachmentStorage(d);
  const restored = recoverInterrupted(
    parseData(
      hydrateAttachmentStorage(JSON.parse(saved.metadata), saved.blobs),
      true,
    ),
  );
  const retry = prepareSend(restored, "c", "", true);
  assert.equal(retry.retryFiles[0].data, "iVBORw0KGgo=");
  assert.equal(retry.preservedReplies[0].status, "interrupted");
  assert.equal(retry.messages.length, 1);
});
