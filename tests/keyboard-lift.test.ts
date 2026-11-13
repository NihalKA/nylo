import test from "node:test";
import assert from "node:assert/strict";
import { KEYBOARD_GAP, keyboardLiftFor } from "../src/keyboard-math";

test("iOS lifts by exactly the covered part of the chat, plus a gap", () => {
  // iPhone 15: 852pt screen, container ends above the 34pt home indicator.
  assert.equal(
    keyboardLiftFor({
      platform: "ios",
      keyboardHeight: 336,
      keyboardTop: 852 - 336,
      containerBottom: 852 - 34,
      safeBottom: 34,
    }),
    336 - 34 + KEYBOARD_GAP,
  );
});

test("iOS falls back to height minus the safe area when unmeasured", () => {
  assert.equal(
    keyboardLiftFor({ platform: "ios", keyboardHeight: 300, safeBottom: 34 }),
    300 - 34 + KEYBOARD_GAP,
  );
});

test("Android edge-to-edge does not subtract the navigation bar twice", () => {
  // RN reports the IME height minus the nav bar; the chat already ends above
  // the nav bar, so the full reported height is the lift.
  assert.equal(
    keyboardLiftFor({
      platform: "android",
      keyboardHeight: 280,
      safeBottom: 48,
    }),
    280 + KEYBOARD_GAP,
  );
});

test("Android adds no extra lift when the window was already resized", () => {
  assert.equal(
    keyboardLiftFor({
      platform: "android",
      keyboardHeight: 280,
      safeBottom: 48,
      windowShrunk: true,
    }),
    KEYBOARD_GAP,
  );
});

test("no keyboard, no lift", () => {
  assert.equal(
    keyboardLiftFor({ platform: "ios", keyboardHeight: 0, safeBottom: 34 }),
    0,
  );
});
