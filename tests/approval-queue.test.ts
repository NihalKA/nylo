import test from "node:test";
import assert from "node:assert/strict";
import { createApprovalQueue } from "../src/approval-queue";
import { deferred } from "./helpers/deferred";

test("approvals do not overlap; stopped displayed prompt cannot approve its request", async () => {
  const queue = createApprovalQueue(() => true);
  const first = deferred<boolean>();
  const stop = new AbortController();
  const shown: string[] = [];
  const a = queue(
    () => {
      shown.push("A");
      return first.promise;
    },
    false,
    stop.signal,
  );
  const b = queue(async () => {
    shown.push("B");
    return true;
  }, false);
  await Promise.resolve();
  assert.deepEqual(shown, ["A"]);
  stop.abort();
  assert.equal(await a, false);
  assert.deepEqual(shown, ["A"]);
  first.resolve(true);
  assert.equal(await b, true);
  assert.deepEqual(shown, ["A", "B"]);
});

test("queued approvals skip stopped requests and requests that moved to background", async () => {
  let foreground = true;
  const queue = createApprovalQueue(() => foreground);
  const first = deferred<boolean>();
  let shown = 0;
  const a = queue(() => first.promise, false);
  const stop = new AbortController();
  const b = queue(
    async () => {
      shown++;
      return true;
    },
    false,
    stop.signal,
  );
  const c = queue(async () => {
    shown++;
    return true;
  }, false);
  await Promise.resolve();
  stop.abort();
  foreground = false;
  first.resolve(true);
  assert.deepEqual(await Promise.all([a, b, c]), [false, false, false]);
  assert.equal(shown, 0);
  foreground = true;
  assert.equal(await queue(async () => true, false), true);
});
