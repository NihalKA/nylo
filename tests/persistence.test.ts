import { test } from "node:test";
import assert from "node:assert/strict";
import { createDurableUpdater } from "../src/persistence";
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
