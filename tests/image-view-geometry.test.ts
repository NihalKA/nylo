import test from "node:test";
import assert from "node:assert/strict";
import {
  fitImage,
  constrainImagePose,
  initialImagePose,
  transformImagePose,
  isImageDoubleTap,
} from "../src/image-view-geometry";

test("portrait and landscape images fit completely without cropping", () => {
  assert.deepEqual(
    fitImage({ width: 400, height: 700 }, { width: 1200, height: 600 }),
    { width: 400, height: 200 },
  );
  assert.deepEqual(
    fitImage({ width: 400, height: 700 }, { width: 600, height: 1200 }),
    { width: 350, height: 700 },
  );
  assert.deepEqual(
    fitImage({ width: 0, height: 700 }, { width: 600, height: 1200 }),
    { width: 0, height: 0 },
  );
});
test("pinch keeps the image point under the moving finger midpoint", () => {
  const view = { width: 400, height: 400 };
  const original = { scale: 2, x: 20, y: -10 };
  const from = { x: 60, y: 40 },
    to = { x: 80, y: 70 };
  const result = transformImagePose(original, from, to, 3, view, view);
  assert.equal(
    (from.x - original.x) / original.scale,
    (to.x - result.x) / result.scale,
  );
  assert.equal(
    (from.y - original.y) / original.scale,
    (to.y - result.y) / result.scale,
  );
});
test("pan bounds prevent exposing blank space beyond zoomed image edges", () => {
  assert.deepEqual(
    constrainImagePose(
      { scale: 3, x: 1000, y: -1000 },
      { width: 400, height: 700 },
      { width: 400, height: 200 },
    ),
    { scale: 3, x: 400, y: 0 },
  );
});
test("zoom clamps to 1–5 times and reset recenters after panning", () => {
  const view = { width: 400, height: 700 };
  const fitted = { width: 400, height: 400 };
  assert.equal(
    constrainImagePose({ scale: 99, x: 0, y: 0 }, view, fitted).scale,
    5,
  );
  const result = transformImagePose(
    { scale: 3, x: 300, y: 200 },
    { x: 80, y: 120 },
    { x: 80, y: 120 },
    0.5,
    view,
    fitted,
  );
  assert.deepEqual(result, initialImagePose);
});
test("rebasing a pinch to one-finger pan preserves its current pose", () => {
  const view = { width: 400, height: 400 };
  const pinched = transformImagePose(
    initialImagePose,
    { x: 0, y: 0 },
    { x: 40, y: 20 },
    2.5,
    view,
    view,
  );
  assert.deepEqual(
    transformImagePose(
      pinched,
      { x: 65, y: 40 },
      { x: 65, y: 40 },
      pinched.scale,
      view,
      view,
    ),
    pinched,
  );
  const dragged = transformImagePose(
    pinched,
    { x: 65, y: 40 },
    { x: 80, y: 35 },
    pinched.scale,
    view,
    view,
  );
  assert.deepEqual(dragged, {
    scale: 2.5,
    x: pinched.x + 15,
    y: pinched.y - 5,
  });
});

test("double tap uses the second touch-down, not its later release", () => {
  const first = { startedAt: 0, endedAt: 100, point: { x: 0, y: 0 } };
  const second = { startedAt: 430, endedAt: 700, point: { x: 4, y: 3 } };
  assert.equal(isImageDoubleTap(first, second), true);
  assert.equal(isImageDoubleTap(first, { ...second, startedAt: 451 }), false);
  assert.equal(isImageDoubleTap(first, { ...second, endedAt: 1000 }), false);
  assert.equal(
    isImageDoubleTap(first, { ...second, point: { x: 80, y: 0 } }),
    false,
  );
});
