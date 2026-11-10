import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const { pinImagePods } = require("../plugins/with-image-pods.cjs");

test("source-built image pods satisfy the SVG renderer's installed dependency constraints", () => {
  const image = readFileSync(
    "node_modules/expo-image/ios/ExpoImage.podspec",
    "utf8",
  );
  const manipulator = readFileSync(
    "node_modules/expo-image-manipulator/ios/ExpoImageManipulator.podspec",
    "utf8",
  );
  assert.match(image, /s[.]dependency 'SDWebImage', '~> 5[.]21[.]0'/);
  assert.match(image, /s[.]dependency 'SDWebImageWebPCoder', '~> 0[.]14[.]6'/);
  assert.match(manipulator, /s[.]dependency 'SDWebImageWebPCoder'\s*\n/);
  const output = pinImagePods("target 'Nylo' do\n  use_expo_modules!\nend\n");
  assert.match(output, /pod 'SDWebImage', '5[.]21[.]6'/);
  assert.match(output, /pod 'SDWebImageWebPCoder', '0[.]14[.]6'/);
  assert.equal(pinImagePods(output), output);
  assert.equal((output.match(/pod 'SDWebImageWebPCoder'/g) || []).length, 1);
});
