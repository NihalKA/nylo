import test from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  compileCalculation,
  formatResult,
} from "../src/reply-calculations";
import { dateValue, localDate, validDate } from "../src/reply-dates";
import { CoalescedWriter } from "../src/coalesced-writer";
import {
  ProviderTextFilter,
  cleanProviderCitations,
} from "../src/provider-text";

test("loan payment matches an independent monthly balance oracle, including zero/tiny rates", () => {
  for (const rate of [0, 1e-10, 5, 12, 30]) {
    const p = 240000,
      years = 30,
      n = years * 12;
    const payment = calculate("@Payment($p,$rate,$years)", { p, rate, years });
    let balance = p;
    for (let i = 0; i < n; i++) balance = balance * (1 + rate / 1200) - payment;
    assert.ok(Math.abs(balance) < 0.001, `balance ${balance} for rate ${rate}`);
    assert.ok(payment >= p / n - 1e-8);
  }
  assert.equal(calculate("@Payment(0,5,30)", {}), 0);
  for (const f of [
    "@Payment(100,5,0)",
    "@Payment(100,-1,5)",
    "@Payment(100,5,0.1)",
    "@Payment(100,5,101)",
    "1/0",
    "@Power(1000000000,100)",
  ])
    assert.throws(() => calculate(f, {}), f);
});
test("restricted arithmetic rejects ignored tokens, actions, unsafe references and excessive work", () => {
  assert.equal(
    calculate("@Max(0,($income-$cost)*12)", { income: 100, cost: 30 }),
    840,
  );
  assert.equal(calculate("@Round(1.234,2)", {}), 1.23);
  for (const source of [
    "1 2",
    "1+",
    "1;2",
    "1=2",
    "$a.b",
    "@Query(1,2)",
    "@Power(2)",
    "@Payment(1,2,3,4)",
    "__proto__",
    "@constructor(1)",
    "1//2",
    "(".repeat(18) + "1" + ")".repeat(18),
    "1+".repeat(90) + "1",
  ])
    assert.throws(() => compileCalculation(source), source);
  assert.throws(() => calculate("$a+1", { a: "1" }));
  assert.throws(() => calculate("$a", { a: Infinity }));
  assert.match(formatResult(100, "$currency", { currency: "INR" }), /100/);
  assert.equal(formatResult(5, "percent"), "5%");
  assert.throws(() => formatResult(5, "$missing"));
});
test("native date-only values survive local timezone conversion and reject impossible dates", () => {
  for (const value of ["2028-02-29", "2026-11-15", "1900-01-01", "2200-12-31"])
    assert.equal(dateValue(localDate(value)), value);
  for (const value of [
    "2027-02-29",
    "2026-13-01",
    "2026-02-30",
    "2026-1-01",
    "1800-01-01",
    "tomorrow",
  ])
    assert.equal(validDate(value), false, value);
});
test("coalesced writes bound a thousand drag updates to active plus latest; flush waits for both", async () => {
  const writes: number[] = [];
  let unblock!: () => void;
  const writer = new CoalescedWriter<number>(
    async (value) => {
      writes.push(value);
      if (writes.length === 1)
        await new Promise<void>((r) => {
          unblock = r;
        });
    },
    () => {},
    1,
  );
  writer.push(0);
  const flushing = writer.flush();
  await Promise.resolve();
  for (let i = 1; i <= 1000; i++) writer.push(i);
  assert.deepEqual(writes, [0]);
  unblock();
  await flushing;
  assert.deepEqual(writes, [0, 1000]);
});
test("storage failure blocks submit flush until a newer snapshot succeeds", async () => {
  const reports: boolean[] = [];
  let fail = true;
  const writer = new CoalescedWriter<number>(
    async () => {
      if (fail) throw Error("private details");
    },
    (failed) => reports.push(failed),
  );
  writer.push(1);
  await assert.rejects(writer.flush(), /Could not save/);
  await assert.rejects(writer.flush(), /Could not save/);
  fail = false;
  writer.push(2);
  await writer.flush();
  assert.deepEqual(reports, [true, false]);
});
test("citation normalization works across every stream split without fabricating sources", () => {
  const raw = "Hello \uE200cite\uE202turn0search1\uE201 world";
  for (let split = 0; split <= raw.length; split++) {
    const f = new ProviderTextFilter();
    assert.equal(
      f.push(raw.slice(0, split)) + f.push(raw.slice(split)) + f.finish(),
      "Hello  world",
    );
  }
  assert.equal(cleanProviderCitations(raw), "Hello  world");
  const f = new ProviderTextFilter();
  assert.equal(f.push("before \uE200citeunfinished") + f.finish(), "before ");
});
test("oversize citation markers stay bounded and never leak their tail", () => {
  const f = new ProviderTextFilter();
  assert.equal(f.push("before\uE200cite" + "x".repeat(3000)), "before");
  assert.equal(f.push("private-tail"), "");
  assert.equal(f.push("\uE201after") + f.finish(), "after");
  const unknown = new ProviderTextFilter();
  assert.equal(
    unknown.push("\uE200unknown\uE201") + unknown.finish(),
    "\uE200unknown\uE201",
  );
});
