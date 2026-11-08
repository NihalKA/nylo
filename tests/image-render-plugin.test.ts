import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  patchImageRenderer,
  ORIGINAL,
  REPLACEMENT,
} = require("../plugins/with-image-render-promise.cjs");

test("image bridge patch preserves surrounding SDK code and is idempotent", () => {
  const source = `before\n${ORIGINAL}\nafter`;
  const result = patchImageRenderer(source, "58.0.16");
  assert.equal(result, `before\n${REPLACEMENT}\nafter`);
  assert.equal(patchImageRenderer(result, "58.0.16"), result);
});

test("native bridge patch fails closed on SDK updates, unknown source and partial edits", () => {
  assert.throws(() => patchImageRenderer(ORIGINAL, "58.0.17"), /SDK version/);
  assert.throws(
    () => patchImageRenderer("changed upstream", "58.0.16"),
    /expected/,
  );
  assert.throws(
    () => patchImageRenderer(ORIGINAL + ORIGINAL, "58.0.16"),
    /expected/,
  );
  assert.throws(
    () =>
      patchImageRenderer(
        REPLACEMENT.replace("result scheduled", "edited"),
        "58.0.16",
      ),
    /modified/,
  );
});
