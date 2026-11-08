import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  patchImageTrace,
  EDITS,
} = require("../plugins/with-image-render-trace.cjs");
const root = dirname(require.resolve("expo-image-manipulator/package.json"));

test("native trace applies to the pinned SDK and preserves the original bridge", () => {
  for (const file of Object.keys(EDITS)) {
    const source = readFileSync(join(root, "ios", file), "utf8");
    const patched = patchImageTrace(source, "58.0.16", file);
    assert.notEqual(patched, source);
    assert.equal(patchImageTrace(patched, "58.0.16", file), patched);
    assert.ok(!patched.includes("promise.resolve"));
  }
});

test("diagnostics fail closed for incompatible SDKs, files and source", () => {
  assert.throws(
    () => patchImageTrace("", "58.0.17", "ImageManipulatorModule.swift"),
    /SDK version/,
  );
  assert.throws(() => patchImageTrace("", "58.0.16", "unknown"), /Unexpected/);
  assert.throws(
    () =>
      patchImageTrace("changed SDK", "58.0.16", "ImageManipulatorModule.swift"),
    /Unexpected/,
  );
});
