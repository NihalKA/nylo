import test from "node:test";
import assert from "node:assert/strict";
import { ReplyTextFilter } from "../src/reply-text";
import { inspectReply } from "../src/interactive-reply";
import { messageTokens } from "../src/message-format";
test("ordinary text streams and mistaken UI answers never leak their language", () => {
  for (const [raw, expected] of [
    ["12 × 8 = 96", "12 × 8 = 96"],
    ["Hello world.", "Hello world."],
    ["x = 2", "x = 2"],
    ["The root = 5.", "The root = 5."],
    ['root = Root([Text("12 × 8 = 96")])', "12 × 8 = 96"],
    [
      'root = Root([Unknown("x")])',
      "The interactive reply could not be displayed. Please try again.",
    ],
  ] as const) {
    for (let split = 0; split <= raw.length; split++) {
      const f = new ReplyTextFilter();
      assert.equal(
        f.push(raw.slice(0, split)) + f.push(raw.slice(split)) + f.finish(),
        expected,
        `${raw} at ${split}`,
      );
    }
  }
});
test("full source validation rejects ignored declarations, trailing tokens and mismatched delimiters", () => {
  for (const source of [
    'root = Root([Text("ok")]) garbage',
    'root = Root([Text("ok")]); evil = 1',
    'root = Root([Text("ok")])\nroot = Root([Text("bye")])',
    'root = Root([Text("ok")}])',
  ])
    assert.throws(() => inspectReply(source), source);
  assert.equal(
    inspectReply('root = Root([intro])\nintro = Text("Quoted (test)")').nodes
      .length,
    1,
  );
});
test("interrupted tables do not promote an unfinished final row; complete tables retain it", () => {
  const table = "| A | B |\n| --- | --- |\n| One | Two";
  const complete = messageTokens(table).find((t) => t.type === "table");
  const partial = messageTokens(table, true).find((t) => t.type === "table");
  assert.equal(complete?.type === "table" && complete.rows.length, 1);
  assert.equal(partial?.type === "table" && partial.rows.length, 0);
});

test("numbered declarations, fences and preambles cannot leak at any split or character boundary", () => {
  const source = 'intro1 = Text("96")\nroot = Root([intro1])';
  for (const [raw, expected] of [
    [source, "96"],
    ["```openui\n" + source + "\n```", "96"],
    ["Here is the answer:\n" + source, "Here is the answer:\n96"],
    [
      "Here is the answer:\n```openui\n" + source + "\n```",
      "Here is the answer:\n96",
    ],
  ] as const) {
    for (let split = 0; split <= raw.length; split++) {
      const f = new ReplyTextFilter();
      assert.equal(
        f.push(raw.slice(0, split)) + f.push(raw.slice(split)) + f.finish(),
        expected,
        `${raw} at ${split}`,
      );
    }
    const f = new ReplyTextFilter();
    assert.equal(
      [...raw].map((c) => f.push(c)).join("") + f.finish(),
      expected,
    );
  }
});
