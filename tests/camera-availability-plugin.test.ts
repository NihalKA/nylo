import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  patchCameraAvailability,
  GUARD,
} = require("../plugins/with-camera-availability.cjs");
const source = readFileSync(
  join(
    dirname(require.resolve("expo-image-picker/package.json")),
    "ios/ImagePickerModule.swift",
  ),
  "utf8",
);
test("camera availability is checked before UIKit camera assignment and preserves other SDK code", () => {
  const patched = patchCameraAvailability(source, "58.0.10");
  assert.equal(patched.replace(GUARD, ""), source);
  assert.equal(patchCameraAvailability(patched, "58.0.10"), patched);
  assert.ok(
    patched.indexOf("isSourceTypeAvailable(.camera)") <
      patched.indexOf("picker.sourceType = .camera"),
  );
  assert.ok(patched.includes("isCameraDeviceAvailable(device)"));
  assert.ok(patched.includes('promise.reject("ERR_CAMERA_UNAVAILABLE"'));
});
test("availability patch fails closed when SDK or source changes", () => {
  assert.throws(
    () => patchCameraAvailability(source, "58.0.11"),
    /SDK version/,
  );
  assert.throws(
    () => patchCameraAvailability("changed SDK", "58.0.10"),
    /Unexpected/,
  );
  assert.throws(
    () => patchCameraAvailability(source + source, "58.0.10"),
    /Unexpected/,
  );
});
