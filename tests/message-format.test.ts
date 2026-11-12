import test from "node:test";
import assert from "node:assert/strict";
import {
  citationLabel,
  messageTokens,
  safeWebUrl,
} from "../src/message-format";
test("response parser handles headings, lists, nested formatting, tables and balanced-parenthesis URLs", () => {
  const tokens = messageTokens(
    "### News\n\n- **Headline**: [Read](https://example.com/news_(today))\n\n|A|B|\n|-|-|\n|1|2|",
  );
  assert.equal(tokens[0].type, "heading");
  assert.ok(tokens.some((t) => t.type === "list"));
  assert.ok(tokens.some((t) => t.type === "table"));
  const list = tokens.find((t) => t.type === "list")!;
  assert.ok(JSON.stringify(list).includes("https://example.com/news_(today)"));
});
test("citations match tracking variants while unsafe link destinations remain inert", () => {
  assert.equal(
    citationLabel("https://example.com/news?utm_source=openai", [
      { title: "News", url: "https://example.com/news" },
    ]),
    "[1]",
  );
  for (const url of [
    "javascript:alert(1)",
    "file:///private/test",
    "data:text/html,test",
    "https://name:secret@example.com",
  ])
    assert.equal(safeWebUrl(url), undefined);
  assert.equal(
    safeWebUrl("https://example.com/news"),
    "https://example.com/news",
  );
});
