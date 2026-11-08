import { test } from "node:test";
import assert from "node:assert/strict";
import { createDurableUpdater } from "../src/persistence";
import { createConversation, promoteConversation } from "../src/domain";
import { AppData, emptyData } from "../src/types";
test("agent promotion with reviewed memory commits together or leaves the original chat untouched", async () => {
  const chat = createConversation("connection");
  let data: AppData = { ...emptyData(), conversations: [chat] };
  let fail = true;
  const update = createDurableUpdater({
    read: () => data,
    write: async () => {
      if (fail) throw new Error("disk full");
    },
    commit: (next) => {
      data = next;
    },
  });
  const promote = () =>
    update((current) =>
      promoteConversation(
        current,
        chat.id,
        {
          name: "Project guide",
          description: "QA",
          instructions: "Help clearly.",
          connectionId: "connection",
          color: "#246B58",
        },
        "I prefer brief answers.",
      ),
    );
  await assert.rejects(promote(), /disk full/);
  assert.equal(data.agents.length, 0);
  assert.equal(data.conversations[0].agentId, undefined);
  fail = false;
  await promote();
  assert.equal(data.agents.length, 1);
  assert.equal(data.conversations[0].agentId, data.agents[0].id);
  assert.equal(data.agents[0].memories[0].text, "I prefer brief answers.");
});
test("a submitted draft remains visible until its message is durably accepted", async () => {
  let data = { draft: "Keep this idea", messages: [] as string[] };
  let finish!: () => void;
  const update = createDurableUpdater({
    read: () => data,
    write: () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    commit: (next) => {
      data = next;
    },
  });
  let accepted = false;
  const saving = update((d) => ({
    draft: "",
    messages: [...d.messages, d.draft],
  })).then(() => {
    accepted = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(data.draft, "Keep this idea");
  assert.equal(accepted, false);
  finish();
  await saving;
  assert.deepEqual(data, { draft: "", messages: ["Keep this idea"] });
  assert.equal(accepted, true);
});
test("failed writes keep the old draft and concurrent later mutations recover from committed state", async () => {
  let data = { draft: "Original", messages: [] as string[] };
  let writes = 0;
  const update = createDurableUpdater({
    read: () => data,
    write: async () => {
      if (++writes === 1) throw new Error("Disk full");
    },
    commit: (next) => {
      data = next;
    },
  });
  const failed = update((d) => ({
    draft: "",
    messages: [...d.messages, d.draft],
  }));
  const newer = update((d) => ({ ...d, draft: d.draft + " plus more" }));
  await assert.rejects(failed, /Disk full/);
  await newer;
  assert.deepEqual(data, { draft: "Original plus more", messages: [] });
});
test("concurrent streaming checkpoints retain every fragment in order", async () => {
  let data = "";
  const update = createDurableUpdater({
    read: () => data,
    write: async () => {},
    commit: (next) => {
      data = next;
    },
  });
  await Promise.all(
    ["Hello", " ", "world", " 🌱"].map((part) =>
      update((current) => current + part),
    ),
  );
  assert.equal(data, "Hello world 🌱");
});
test("a failed final response checkpoint stays failed even after the storage queue recovers", async () => {
  const { createCheckpointBarrier } = await import("../src/persistence");
  let text = "partial";
  let count = 0;
  let aborted = false;
  let complete = false;
  const update = createDurableUpdater({
    read: () => text,
    write: async () => {
      if (++count === 1) throw new Error("Disk checkpoint failed");
    },
    commit: (next) => {
      text = next;
    },
  });
  const checkpoints = createCheckpointBarrier(() => {
    aborted = true;
  });
  checkpoints.track(update((current) => current + " missing tail"));
  checkpoints.track(update((current) => current + " later write"));
  await assert.rejects(async () => {
    await checkpoints.finish();
    complete = true;
  }, /Disk checkpoint failed/);
  assert.equal(aborted, true);
  assert.equal(complete, false);
  assert.equal(text, "partial later write");
});
