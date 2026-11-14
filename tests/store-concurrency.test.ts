import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import { credentialDestination } from "../src/credentials";
import {
  emptyData,
  type AppData,
  type Attachment,
  type Connection,
} from "../src/types";
import { deferred, mountStore } from "./helpers/store-harness";

const connection: Connection = {
  id: "provider",
  name: "Synthetic QA",
  protocol: "openai",
  model: "test-model",
  baseUrl: "https://example.com/v1",
};
function fixture(): AppData {
  return {
    ...emptyData(),
    connections: [connection],
    defaultConnectionId: connection.id,
    conversations: ["a", "b"].map((id) => ({
      id,
      title: id,
      connectionId: connection.id,
      messages: [],
      draft: id,
      createdAt: 1,
      updatedAt: 1,
    })),
    providerConsents: [
      {
        credentialId: connection.id,
        destination: credentialDestination(connection),
        revision: 3,
        grantedAt: 1,
      },
    ],
  };
}
const image: Attachment = {
  id: "generated-image",
  name: "result.png",
  mimeType: "image/png",
  data: "aW1hZ2U=",
  size: 5,
};

test("overlapping image/text replies save to their own chats; finishing B leaves A running", async () => {
  const h = await mountStore(fixture());
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    assert.deepEqual(h.store.runningIds, ["a", "b"]);
    assert.equal(h.requests.length, 2);
    const [ra, rb] = h.requests;
    await act(async () => {
      ra.request.onStage?.("image");
      rb.request.onStage?.("reply");
      await ra.request.onFiles?.([image]);
      rb.request.onText("Reply B");
      rb.done.resolve();
      await b;
    });
    assert.deepEqual(h.store.runningIds, ["a"]);
    assert.equal(h.store.responseProgress.a.stage, "image");
    assert.equal(h.store.responseProgress.b, undefined);
    await act(async () => {
      ra.request.onText("Image A");
      ra.done.resolve();
      await a;
    });
    assert.deepEqual(h.store.runningIds, []);
    const [ca, cb] = h.saved().conversations;
    assert.equal(ca.messages.at(-1)?.text, "Image A");
    assert.deepEqual(ca.messages.at(-1)?.generatedFiles, [image]);
    assert.equal(cb.messages.at(-1)?.text, "Reply B");
    assert.equal(cb.messages.at(-1)?.generatedFiles, undefined);
    assert.equal(ca.messages.at(-1)?.status, "complete");
    assert.equal(cb.messages.at(-1)?.status, "complete");
    assert.equal(h.released.length, 2);
  } finally {
    await h.close();
  }
});

test("stopping A retains partial output and does not stop B; next A can start", async () => {
  const h = await mountStore(fixture());
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    const [ra, rb] = h.requests;
    await act(async () => {
      ra.request.onText("Partial A");
      await ra.request.onFiles?.([image]);
      h.store.stop("a");
      await a;
    });
    assert.equal(ra.request.signal.aborted, true);
    assert.equal(rb.request.signal.aborted, false);
    assert.deepEqual(h.store.runningIds, ["b"]);
    assert.equal(
      h.saved().conversations[0].messages.at(-1)?.status,
      "interrupted",
    );
    assert.equal(h.saved().conversations[0].messages.at(-1)?.text, "Partial A");
    assert.deepEqual(
      h.saved().conversations[0].messages.at(-1)?.generatedFiles,
      [image],
    );
    let next!: Promise<void>;
    await act(async () => {
      next = h.store.send("a", "follow-up");
    });
    await act(async () => {
      rb.request.onText("B continued");
      rb.done.resolve();
      await b;
      h.requests[2].done.resolve();
      await next;
    });
    assert.equal(
      h.saved().conversations[1].messages.at(-1)?.text,
      "B continued",
    );
  } finally {
    await h.close();
  }
});

test("a failed response cannot clear another chat's running state", async () => {
  const h = await mountStore(fixture());
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    await act(async () => {
      h.requests[0].done.reject(new Error("Synthetic failure"));
      await a;
    });
    assert.deepEqual(h.store.runningIds, ["b"]);
    assert.equal(h.saved().conversations[0].messages.at(-1)?.status, "error");
    await act(async () => {
      h.requests[1].done.resolve();
      await b;
    });
  } finally {
    await h.close();
  }
});

test("same-chat reservation prevents double sends before key lookup completes", async () => {
  const key = deferred<string>();
  const h = await mountStore(fixture(), { readKey: () => key.promise });
  try {
    let a!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
    });
    await assert.rejects(h.store.send("a", "duplicate"), /already responding/);
    await assert.rejects(h.store.deleteConnection(connection.id), /Stop/);
    await assert.rejects(h.store.importBackup(fixture()), /Stop/);
    await act(async () => {
      h.store.stop("a");
      key.resolve("synthetic");
      await assert.rejects(a, /draft is kept/);
    });
    assert.equal(h.requests.length, 0);
    assert.equal(h.saved().conversations[0].draft, "a");
    assert.deepEqual(h.store.runningIds, []);
  } finally {
    await h.close();
  }
});

test("cancelled approval keeps the draft while a different chat continues", async () => {
  const data = fixture();
  const other = { ...connection, id: "unapproved", name: "Other provider" };
  data.connections.push(other);
  data.conversations[0].connectionId = other.id;
  const permission = deferred<boolean>();
  const h = await mountStore(data, { permission: () => permission.promise });
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    assert.equal(h.requests.length, 1);
    await act(async () => {
      h.store.stop("a");
      await assert.rejects(a, /Nothing was sent/);
    });
    assert.deepEqual(h.store.runningIds, ["b"]);
    await act(async () => {
      permission.resolve(true);
      h.requests[0].done.resolve();
      await b;
    });
    assert.equal(h.saved().conversations[0].draft, "a");
    assert.equal(
      h.saved().providerConsents?.some((c) => c.credentialId === other.id),
      false,
    );
    assert.equal(h.requests.length, 1);
  } finally {
    await h.close();
  }
});

test("background eligibility is checked for every response, not just the first", async () => {
  let count = 0;
  const h = await mountStore(fixture(), { background: () => ++count === 1 });
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    await h.background();
    await act(async () => {
      await b;
    });
    assert.equal(h.requests[0].request.signal.aborted, false);
    assert.equal(h.requests[1].request.signal.aborted, true);
    assert.deepEqual(h.store.runningIds, ["a"]);
    await act(async () => {
      h.requests[0].done.resolve();
      await a;
    });
  } finally {
    await h.close();
  }
});

test("interleaved storage failure interrupts only its affected run and queue recovers", async () => {
  let fail = false;
  const h = await mountStore(fixture(), {
    write: async (data) => {
      if (fail && data.conversations[0].messages.at(-1)?.text === "A chunk") {
        fail = false;
        throw new Error("Synthetic disk failure");
      }
    },
  });
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    await act(async () => {
      fail = true;
      h.requests[0].request.onText("A chunk");
      h.requests[0].done.resolve();
      await a;
    });
    assert.equal(
      h.saved().conversations[0].messages.at(-1)?.status,
      "interrupted",
    );
    assert.equal(h.requests[1].request.signal.aborted, false);
    await act(async () => {
      h.requests[1].request.onText("B survives");
      h.requests[1].done.resolve();
      await b;
    });
    assert.equal(
      h.saved().conversations[1].messages.at(-1)?.text,
      "B survives",
    );
  } finally {
    await h.close();
  }
});

test("simultaneous memory proposals keep both approved memories for the same agent", async () => {
  const data = fixture();
  data.agents = [
    {
      id: "agent",
      name: "QA",
      description: "",
      instructions: "",
      connectionId: connection.id,
      color: "#246B58",
      memories: [],
      createdAt: 1,
    },
  ];
  data.conversations.forEach((chat) => {
    chat.agentId = "agent";
  });
  const answers = [deferred<boolean>(), deferred<boolean>()];
  const prompts: string[] = [];
  const h = await mountStore(data, {
    permission: async (_, message) => {
      prompts.push(message);
      return answers[prompts.length - 1].promise;
    },
  });
  try {
    let a!: Promise<void>,
      b!: Promise<void>,
      ma!: Promise<string>,
      mb!: Promise<string>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    await act(async () => {
      ma = h.requests[0].request.executeTool!({
        id: "call-a",
        name: "remember_fact",
        arguments: JSON.stringify({ text: "Fact A" }),
      });
      mb = h.requests[1].request.executeTool!({
        id: "call-b",
        name: "remember_fact",
        arguments: JSON.stringify({ text: "Fact B" }),
      });
    });
    assert.equal(prompts.length, 1);
    assert.match(prompts[0], /Chat "a"/);
    await act(async () => {
      answers[0].resolve(true);
      await ma;
    });
    assert.equal(prompts.length, 2);
    assert.match(prompts[1], /Chat "b"/);
    await act(async () => {
      answers[1].resolve(true);
      await mb;
      h.requests.forEach((r) => r.done.resolve());
      await Promise.all([a, b]);
    });
    assert.deepEqual(
      h.saved().agents[0].memories.map((m) => m.text),
      ["Fact A", "Fact B"],
    );
  } finally {
    await h.close();
  }
});

test("a queued provider approval preserves scopes granted by another concurrent chat", async () => {
  const data = fixture();
  data.providerConsents = [];
  const answers = [deferred<boolean>(), deferred<boolean>()];
  let prompts = 0;
  const h = await mountStore(data, {
    permission: () => answers[prompts++].promise,
  });
  try {
    let a!: Promise<void>, b!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
      b = h.store.send("b", "b");
    });
    await act(async () => {
      answers[0].resolve(true);
    });
    await act(async () => {
      await h.store.update((d) => ({
        ...d,
        providerConsents: d.providerConsents?.map((c) => ({
          ...c,
          generatedImageEditChats: ["a"],
        })),
      }));
    });
    await act(async () => {
      answers[1].resolve(true);
    });
    assert.deepEqual(h.saved().providerConsents?.[0].generatedImageEditChats, [
      "a",
    ]);
    await act(async () => {
      h.requests.forEach((r) => r.done.resolve());
      await Promise.all([a, b]);
    });
  } finally {
    await h.close();
  }
});

test("new chat cannot reuse a blank conversation reserved by a pending send", async () => {
  const data = fixture();
  data.conversations = data.conversations.slice(0, 1);
  data.conversations[0].draft = "";
  const key = deferred<string>();
  const h = await mountStore(data, { readKey: () => key.promise });
  try {
    let a!: Promise<void>, id!: string;
    await act(async () => {
      a = h.store.send("a", "test");
    });
    await act(async () => {
      id = await h.store.newChat();
    });
    assert.notEqual(id, "a");
    await act(async () => {
      key.resolve("synthetic");
    });
    await act(async () => {
      h.requests[0].done.resolve();
      await a;
    });
  } finally {
    await h.close();
  }
});

test("late progress from an old response cannot overwrite a new response in that chat", async () => {
  const h = await mountStore(fixture());
  try {
    let a!: Promise<void>, next!: Promise<void>;
    await act(async () => {
      a = h.store.send("a", "a");
    });
    const old = h.requests[0];
    await act(async () => {
      old.done.resolve();
      await a;
    });
    await act(async () => {
      next = h.store.send("a", "next");
    });
    await act(async () => {
      h.requests[1].request.onStage?.("reply");
      old.request.onStage?.("image");
    });
    assert.equal(h.store.responseProgress.a.stage, "reply");
    await act(async () => {
      h.requests[1].done.resolve();
      await next;
    });
  } finally {
    await h.close();
  }
});

test("live device-check sends stay exclusive while ordinary chats allow concurrency", async () => {
  const data = fixture();
  data.deviceCheck = {
    agentId: "qa-agent",
    streamChatId: "a",
    recallChatId: "qa-recall",
    connectionId: connection.id,
    word: "synthetic",
    sessionId: "test",
    createdAt: 1,
  };
  const h = await mountStore(data);
  try {
    let diagnostic!: Promise<void>;
    await act(async () => {
      diagnostic = h.store.send("a", "test", false, undefined, {
        deviceCheck: true,
        maxOutputTokens: 128,
        tools: false,
      });
    });
    await assert.rejects(h.store.send("b", "b"), /live device check/);
    await act(async () => {
      h.requests[0].done.resolve();
      await diagnostic;
    });
    let ordinary!: Promise<void>;
    await act(async () => {
      ordinary = h.store.send("b", "b");
    });
    await assert.rejects(
      h.store.send("a", "test", false, undefined, {
        deviceCheck: true,
        maxOutputTokens: 128,
        tools: false,
      }),
      /live device check/,
    );
    await act(async () => {
      h.requests[1].done.resolve();
      await ordinary;
    });
  } finally {
    await h.close();
  }
});

test("Home while native protection starts waits for the grant without cancelling or replaying", async () => {
  const grant = deferred<boolean>();
  const h = await mountStore(fixture(), {
    backgroundBegin: () => grant.promise,
  });
  try {
    let send!: Promise<void>;
    await act(async () => {
      send = h.store.send("a", "a");
    });
    assert.equal(h.requests.length, 0);
    await h.background();
    await act(async () => {
      grant.resolve(true);
    });
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].request.signal.aborted, false);
    await act(async () => {
      await h.requests[0].request.onFiles?.([image]);
      h.requests[0].request.onText("Finished in background");
      h.requests[0].done.resolve();
      await send;
    });
    assert.equal(h.requests.length, 1);
    const reply = h.saved().conversations[0].messages.at(-1)!;
    assert.equal(reply.text, "Finished in background");
    assert.equal(reply.status, "complete");
    assert.deepEqual(reply.generatedFiles, [image]);
    assert.equal(h.released.length, 1);
  } finally {
    await h.close();
  }
});

test("denied native startup after Home sends nothing and keeps the draft", async () => {
  const grant = deferred<boolean>();
  const h = await mountStore(fixture(), {
    backgroundBegin: () => grant.promise,
  });
  try {
    let send!: Promise<void>;
    await act(async () => {
      send = h.store.send("a", "a");
    });
    await h.background();
    await act(async () => {
      grant.resolve(false);
      await assert.rejects(send, /Return to Nylo/);
    });
    assert.equal(h.requests.length, 0);
    assert.equal(h.saved().conversations[0].draft, "a");
    assert.equal(h.saved().conversations[0].messages.length, 0);
  } finally {
    await h.close();
  }
});

test("late iOS expiry after returning active does not cancel the foreground response", async () => {
  const h = await mountStore(fixture());
  try {
    let send!: Promise<void>;
    await act(async () => {
      send = h.store.send("a", "a");
    });
    await h.background();
    await h.appState("active");
    await h.expireLeases();
    assert.equal(h.requests[0].request.signal.aborted, false);
    assert.equal(h.store.responseProgress.a.backgroundAllowed, false);
    await act(async () => {
      h.requests[0].done.resolve();
      await send;
    });
    assert.equal(
      h.saved().conversations[0].messages.at(-1)?.status,
      "complete",
    );
  } finally {
    await h.close();
  }
});

test("OS expiry in background interrupts once and retains checkpointed output", async () => {
  const h = await mountStore(fixture());
  try {
    let send!: Promise<void>;
    await act(async () => {
      send = h.store.send("a", "a");
    });
    await act(async () => {
      await h.requests[0].request.onFiles?.([image]);
      h.requests[0].request.onText("Partial reply");
    });
    await h.appState("inactive");
    assert.equal(h.requests[0].request.signal.aborted, false);
    await h.background();
    await h.expireLeases();
    await act(async () => {
      await send;
    });
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].request.signal.aborted, true);
    const reply = h.saved().conversations[0].messages.at(-1)!;
    assert.equal(reply.status, "interrupted");
    assert.equal(reply.text, "Partial reply");
    assert.deepEqual(reply.generatedFiles, [image]);
    assert.match(reply.error || "", /operating system ended/);
  } finally {
    await h.close();
  }
});
