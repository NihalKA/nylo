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
    readInteractiveReply({ version: 2, source: phoneSource, fallback: "Text" }),
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
