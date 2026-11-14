import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectReply,
  readInteractiveReply,
  replyValues,
  replySubmission,
} from "../src/interactive-reply";
import { parseData } from "../src/domain";
import { prepareSend } from "../src/send-plan";

import {
  phoneSource,
  expenseSource,
  formSource,
  phoneReply,
  interactiveFixture,
} from "./helpers/interactive-fixtures";
test("three complete journeys parse with only their registered components", () => {
  assert.equal(inspectReply(phoneSource).controls.length, 2);
  assert.equal(inspectReply(expenseSource).submit, undefined);
  assert.equal(inspectReply(formSource).controls[0].required, true);
});
test("incomplete, dynamic, unknown and inconsistent interfaces fail closed", () => {
  for (const source of [
    `root = Root([Text("unfinished")`,
    `root = Root([Unknown("x")])`,
    `root = Root([Table(["A", "B"], [["one"]])])`,
    `root = Root([Select("x", "X", ["A"], "B")])`,
    `root = Root([Slider("x", "X", 10, 0, 1, 5)])`,
    `root = Root([Slider("x", "X", 0, 10, 3, 5)])`,
    `root = Root([Input("x", "X", "", false), Input("x", "Y", "", false)])`,
    `root = Root([Chart("X", "bar", [{label:"a", value:1}], "missing")])`,
    `root = Root([Submit("A", "A"), Submit("B", "B")])`,
    `$value = "x"\nroot = Root([Text($value)])`,
    `data = Query("remote", {})\nroot = Root([Text("hello")])`,
  ])
    assert.throws(() => inspectReply(source), source);
});
test("values restore only declared fields and valid choices; submit validates required input", () => {
  const values = replyValues(phoneSource, {
    budget: 35000,
    priority: "Camera",
    extra: "ignored",
  });
  assert.deepEqual(values, { budget: 35000, priority: "Camera" });
  assert.deepEqual(
    replyValues(phoneSource, { budget: Infinity, priority: "Bad" }),
    { budget: 40000, priority: "Battery" },
  );
  assert.deepEqual(
    replyValues(phoneSource, JSON.parse('{"__proto__":{"polluted":true}}')),
    { budget: 40000, priority: "Battery" },
  );
  assert.match(
    replySubmission(phoneReply(), values),
    /Budget: 35000\nPriority: Camera/,
  );
  const form = readInteractiveReply({
    version: 1,
    source: formSource,
    fallback: "Tell me your trip goal",
    values: {},
  })!;
  assert.throws(() => replySubmission(form, {}), /required/);
  assert.match(
    replySubmission(form, { goal: "Rest", notes: "Quiet place" }),
    /Trip goal: Rest/,
  );
});
test("interactive state round-trips in local storage and backups; old messages remain valid", () => {
  const data = interactiveFixture();
  data.conversations[0].messages[1].interactive!.values = {
    budget: 35000,
    priority: "Camera",
  };
  for (const local of [true, false]) {
    const restored = parseData(JSON.parse(JSON.stringify(data)), local);
    assert.deepEqual(
      restored.conversations[0].messages[1].interactive!.values,
      { budget: 35000, priority: "Camera" },
    );
  }
  data.conversations[0].messages[1].interactive = undefined;
  assert.equal(
    parseData(data).conversations[0].messages[1].interactive,
    undefined,
  );
  assert.equal(
    readInteractiveReply({ version: 3, source: phoneSource, fallback: "Text" }),
    undefined,
  );
});
test("explicit submission preserves unrelated draft/files and marks only accepted prospective history", () => {
  const data = interactiveFixture();
  const interaction = {
    messageId: "a",
    values: { budget: 35000, priority: "Camera" },
  };
  const prepared = prepareSend(data, "c", "", false, false, interaction);
  assert.deepEqual(prepared.attachments, []);
  assert.equal(prepared.messages.at(-1)!.text, prepared.input);
  assert.equal(prepared.messages[1].interactive!.submitted, prepared.input);
  assert.equal(
    data.conversations[0].messages[1].interactive!.submitted,
    undefined,
  );
  assert.equal(data.conversations[0].draft, "keep my draft");
  assert.equal(data.conversations[0].draftAttachments!.length, 1);
  data.conversations[0].messages = prepared.messages;
  assert.throws(
    () => prepareSend(data, "c", "", false, false, interaction),
    /already been sent/,
  );
  data.conversations[0].messages[1].status = "interrupted";
  assert.throws(
    () => prepareSend(data, "c", "", false, false, interaction),
    /finish/,
  );
});

test("version two calculators and calendar ranges restore without losing exact inputs", () => {
  const source = `root = Root([Number("amount","Amount",0,1000000,1000,240000,"INR"), Number("rate","Rate",0,30,0.1,5,"%"), Number("years","Years",1,40,1,30), Metric("Payment","@Payment($amount,$rate,$years)","INR"), DateInput("start","Start","",true), DateInput("end","End","",true,"start"), Submit("Plan","Plan with my choices")])`;
  const reply = readInteractiveReply({
    version: 2,
    source,
    fallback: "Loan and dates",
    values: { amount: 123456.78, start: "2026-12-20", end: "2026-12-19" },
  })!;
  assert.equal(reply.values.amount, 123456.78);
  assert.throws(() => replySubmission(reply, reply.values), /End date/);
  assert.match(
    replySubmission(reply, { ...reply.values, end: "2026-12-21" }),
    /Start: 2026-12-20/,
  );
  assert.deepEqual(
    readInteractiveReply(JSON.parse(JSON.stringify(reply))),
    reply,
  );
  for (const s of [
    `root = Root([Metric("Payment","$unknown*2")])`,
    `root = Root([DateInput("start","Start","2026-02-30",true)])`,
    `root = Root([DateInput("end","End","",true,"unknown")])`,
    `root = Root([Details("Options",[Input("goal","Goal","",true)])])`,
    `root = Root([Number("p","Principal",0,10000,100,1000),Metric("P","@Query($p)")])`,
  ])
    assert.throws(() => inspectReply(s), s);
});
test("calendar constraints cannot cycle and groups cannot hide invalid subtrees", () => {
  for (const source of [
    'root = Root([DateInput("a","A","",false,"b"),DateInput("b","B","",false,"a")])',
    'root = Root([Details("Options",[Root([Text("bad")])])])',
    'root = Root([Details("Options",[Details("Nested",[Text("bad")])])])',
  ])
    assert.throws(() => inspectReply(source), source);
});

test("captured real-model journeys use numeric results, calendars, supplied-data filters and direct answers", async () => {
  const { readFileSync } = await import("node:fs");
  const { calculate } = await import("../src/reply-calculations");
  const fixture = JSON.parse(
    readFileSync("e2e/fixtures/interactive-model-output.json", "utf8"),
  );
  for (const c of fixture.cases) {
    if (!c.reply) {
      assert.ok(c.text.trim());
      assert.ok(!c.text.includes("root ="));
      continue;
    }
    const r = readInteractiveReply(c.reply)!;
    assert.ok(r, c.id);
    const parsed = inspectReply(r.source);
    if (c.id === "loan") {
      assert.equal(
        parsed.controls.filter((c) => c.type === "Number").length,
        3,
      );
      const metrics = parsed.nodes.filter((n) => n.typeName === "Metric");
      assert.ok(metrics.length >= 3);
      for (const m of metrics)
        assert.ok(
          Number.isFinite(calculate(String(m.props.expression), r.values)),
        );
      const amount = parsed.controls.find(
        (c) => c.type === "Number" && /amount|principal/i.test(c.label),
      )!;
      const expr = String(metrics[0].props.expression);
      assert.notEqual(
        calculate(expr, r.values),
        calculate(expr, {
          ...r.values,
          [amount.name]: Number(r.values[amount.name]) / 2,
        }),
      );
    }
    if (c.id === "travel-v2")
      assert.equal(
        parsed.controls.filter((c) => c.type === "DateInput").length,
        2,
      );
    if (c.id === "phones")
      assert.ok(
        parsed.nodes.some(
          (n) =>
            n.typeName === "Table" && typeof n.props.filterField === "object",
        ),
      );
  }
});
