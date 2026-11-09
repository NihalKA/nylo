import test from "node:test";
import assert from "node:assert/strict";
import {
  acquireResponseLease,
  ResponseLeaseAdapter,
} from "../src/response-lifetime";

function fixture(begin: ResponseLeaseAdapter["begin"] = async () => true) {
  let listener: ((token: string) => void) | undefined;
  const ended: string[] = [];
  let removed = 0;
  const adapter: ResponseLeaseAdapter = {
    begin,
    end: async (token) => {
      ended.push(token);
    },
    subscribe: (callback) => {
      listener = callback;
      return () => {
        removed++;
      };
    },
  };
  return {
    adapter,
    ended,
    expire: (token: string) => listener?.(token),
    removed: () => removed,
  };
}
test("response lease ignores other responses and releases native time exactly once", async () => {
  const f = fixture();
  let interrupted = 0;
  const lease = await acquireResponseLease(
    f.adapter,
    "current",
    () => interrupted++,
  );
  assert.equal(lease.held, true);
  f.expire("previous");
  assert.equal(interrupted, 0);
  assert.equal(lease.held, true);
  lease.release();
  lease.release();
  f.expire("current");
  assert.equal(interrupted, 0);
  assert.equal(lease.held, false);
  assert.deepEqual(f.ended, ["current"]);
  assert.equal(f.removed(), 1);
});
test("native expiry revokes background eligibility and interrupts the matching response", async () => {
  const f = fixture();
  let interrupted = 0;
  const lease = await acquireResponseLease(
    f.adapter,
    "response",
    () => interrupted++,
  );
  f.expire("response");
  assert.equal(lease.held, false);
  assert.equal(interrupted, 1);
  lease.release();
  assert.equal(f.removed(), 1);
});
test("an expiration racing the begin result cannot restore an expired lease", async () => {
  let resolve!: (value: boolean) => void;
  const f = fixture(
    () =>
      new Promise<boolean>((done) => {
        resolve = done;
      }),
  );
  let interrupted = 0;
  const pending = acquireResponseLease(
    f.adapter,
    "response",
    () => interrupted++,
  );
  f.expire("response");
  resolve(true);
  const lease = await pending;
  assert.equal(lease.held, false);
  assert.equal(interrupted, 1);
  lease.release();
});
test("missing, denied and failed native leases preserve foreground-only behavior", async () => {
  const missing = await acquireResponseLease(null, "web", () => assert.fail());
  assert.equal(missing.held, false);
  missing.release();
  for (const begin of [
    async () => false,
    async () => {
      throw new Error("unavailable");
    },
  ]) {
    const f = fixture(begin);
    const lease = await acquireResponseLease(f.adapter, "response", () =>
      assert.fail(),
    );
    assert.equal(lease.held, false);
    lease.release();
    assert.equal(f.removed(), 1);
    assert.deepEqual(f.ended, ["response"]);
  }
});

test("Stop during native acquisition returns promptly and disposes a late grant", async () => {
  let resolve!: (value: boolean) => void;
  const f = fixture(
    () =>
      new Promise<boolean>((done) => {
        resolve = done;
      }),
  );
  const controller = new AbortController();
  const pending = acquireResponseLease(
    f.adapter,
    "slow",
    () => {},
    controller.signal,
  );
  controller.abort();
  const lease = await pending;
  assert.equal(lease.held, false);
  assert.equal(f.removed(), 1);
  resolve(true);
  await new Promise((done) => setImmediate(done));
  assert.deepEqual(f.ended, ["slow", "slow"]);
  lease.release();
  assert.equal(f.removed(), 1);
});
test("an active lease releases immediately on response cancellation", async () => {
  const f = fixture();
  const controller = new AbortController();
  const lease = await acquireResponseLease(
    f.adapter,
    "send",
    () => {},
    controller.signal,
  );
  controller.abort();
  assert.equal(lease.held, false);
  assert.deepEqual(f.ended, ["send"]);
  lease.release();
  assert.equal(f.removed(), 1);
});
