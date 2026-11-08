import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertAttachmentActive,
  attachmentStep,
  prepareAttachments,
} from "../src/attachment-operation";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("preparation deadline returns control without waiting for native work", async () => {
  let signal!: AbortSignal;
  const pending = deferred<string>();
  await assert.rejects(
    prepareAttachments((current) => {
      signal = current;
      return pending.promise;
    }, 5),
    /Your draft is safe/,
  );
  assert.equal(signal.aborted, true);
  assert.throws(() => assertAttachmentActive(signal), /too long/);
  // A subsequent operation has a fresh signal and can finish normally.
  assert.equal(
    await prepareAttachments(async () => "new result"),
    "new result",
  );
  pending.resolve("obsolete result");
});

test("late native resources are discarded once and never published", async () => {
  const controller = new AbortController();
  const pending = deferred<{ release: () => void }>();
  let releases = 0;
  const result = attachmentStep(pending.promise, controller.signal, (late) =>
    late.release(),
  );
  controller.abort(new Error("expired"));
  await assert.rejects(result, /expired/);
  pending.resolve({ release: () => releases++ });
  await pending.promise;
  assert.equal(releases, 1);
});

test("successful resources transfer to the caller and ignore later aborts", async () => {
  const controller = new AbortController();
  let discards = 0;
  assert.equal(
    await attachmentStep(
      Promise.resolve("owned result"),
      controller.signal,
      () => discards++,
    ),
    "owned result",
  );
  controller.abort();
  assert.equal(discards, 0);
});

test("already cancelled steps still dispose a late value and consume late rejection", async () => {
  const controller = new AbortController();
  controller.abort(new Error("expired"));
  let discarded = false;
  await assert.rejects(
    attachmentStep(Promise.resolve("file"), controller.signal, () => {
      discarded = true;
    }),
    /expired/,
  );
  assert.equal(discarded, true);
  await assert.rejects(
    attachmentStep(
      Promise.reject(new Error("native failure")),
      controller.signal,
    ),
    /expired/,
  );
});
