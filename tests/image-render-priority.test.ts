import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  patchImagePriority,
} = require("../plugins/with-image-render-priority.cjs");
const file = "ImageManipulatorContext.swift";
const source = readFileSync(
  join(
    dirname(require.resolve("expo-image-manipulator/package.json")),
    "ios",
    file,
  ),
  "utf8",
);
test("image priority covers loader, transformer and reset without changing other SDK code", () => {
  const patched = patchImagePriority(source, "58.0.16");
  assert.equal(patched.split("Task(priority: .userInitiated)").length - 1, 3);
  assert.equal(patched.replaceAll(".userInitiated", ".background"), source);
  assert.equal(patchImagePriority(patched, "58.0.16"), patched);
});
test("priority patch fails closed on SDK changes or partial/unknown tasks", () => {
  assert.throws(() => patchImagePriority(source, "58.0.17"), /SDK version/);
  assert.throws(
    () =>
      patchImagePriority(source.replace(".background", ".utility"), "58.0.16"),
    /Unexpected/,
  );
});
