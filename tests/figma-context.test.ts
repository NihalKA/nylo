import test from "node:test";
import assert from "node:assert/strict";
import { extractContext } from "../tools/design/extract-context";

test("retained context extraction includes template-literal and quoted visible copy", () => {
  const input =
    '<div data-node-id="2:1"><p>{`Save & start agent`}</p><p>{"All instructions"}</p><p>Plain text</p></div>';
  const node = extractContext(input, "fixture.tsx", "2:1")["2:1"];
  assert.equal(node.text, "Save & start agent All instructions Plain text");
  assert.deepEqual(node.unresolvedTextExpressions, []);
  assert.equal((node.paragraphs as unknown[]).length, 3);
});

test("context extraction flags dynamic text instead of silently treating it as complete", () => {
  const node = extractContext(
    '<div data-node-id="2:1"><p>{personalText}</p></div>',
    "fixture.tsx",
    "2:1",
  )["2:1"];
  assert.deepEqual(node.unresolvedTextExpressions, ["personalText"]);
  assert.throws(
    () =>
      extractContext(
        '<><div data-node-id="2:1"/><div data-node-id="2:1"/></>',
        "fixture.tsx",
        "2:1",
      ),
    /Duplicate/,
  );
});
