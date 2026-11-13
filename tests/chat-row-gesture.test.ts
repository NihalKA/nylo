import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createConversation } from "../src/domain";

type Handler = (...args: any[]) => any;
async function mountRow() {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const archives: [string, boolean][] = [];
  const deletes: string[] = [];
  let allowDelete = false;
  let navigations = 0;
  let confirmCount = 0;
  const dimensions = { width: 402, fontScale: 1 };
  class Value {
    value: number;
    constructor(value: number) {
      this.value = value;
    }
    setValue(value: number) {
      this.value = value;
    }
    stopAnimation() {}
  }
  // Keep React and the real ChatRow, replacing only native primitives/gesture delivery.
  const GestureView = (props: Record<string, unknown>) =>
    React.createElement("div", props);
  const Row = (_props: Record<string, unknown>) => null;
  const Action = (_props: Record<string, unknown>) => null;
  const modules: Record<string, unknown> = {
    react: React,
    "react-native": {
      Animated: {
        View: GestureView,
        Value,
        timing: (value: Value, config: { toValue: number }) => ({
          start: () => value.setValue(config.toValue),
        }),
      },
      View: "View",
      PanResponder: {
        create: (config: Record<string, Handler>) => ({ panHandlers: config }),
      },
      useWindowDimensions: () => dimensions,
    },
    "./typography": { Text: "Text" },
    "./motion": { useReducedMotion: () => false },
    "./ui": {
      ConversationRow: Row,
      Icon: "Icon",
      Tappable: Action,
      confirm: async () => {
        confirmCount++;
        return allowDelete;
      },
      s: { error: {} },
      theme: {},
    },
    "./store": {
      useStore: () => ({
        archiveChat: async (id: string, archived: boolean) => {
          archives.push([id, archived]);
        },
        deleteChat: async (id: string) => {
          deletes.push(id);
        },
      }),
    },
  };
  const compiled = ts.transpileModule(
    readFileSync(new URL("../src/chat-row.tsx", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exported = { exports: {} as typeof import("../src/chat-row") };
  new Function("require", "module", "exports", compiled)(
    (id: string) => {
      assert.ok(id in modules, `Unexpected dependency ${id}`);
      return modules[id];
    },
    exported,
    exported.exports,
  );
  const conversation = {
    ...createConversation("provider"),
    id: "chat",
    title: "QA chat",
  };
  const props = {
    conversation,
    onPress: () => {
      navigations++;
    },
  };
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(React.createElement(exported.exports.ChatRow, props));
  });
  const gesture = () =>
    renderer.root.findByType(GestureView).props as Record<string, Handler>;
  const row = () => renderer.root.findByType(Row).props;
  const actions = () => renderer.root.findAllByType(Action);
  return {
    gesture,
    row,
    actions,
    archives,
    deletes,
    dimensions,
    get navigations() {
      return navigations;
    },
    get confirmCount() {
      return confirmCount;
    },
    allowDelete: () => {
      allowDelete = true;
    },
    rerender: async () => {
      await act(async () =>
        renderer.update(
          React.createElement(exported.exports.ChatRow, { ...props }),
        ),
      );
    },
    close: async () => {
      await act(async () => renderer.unmount());
    },
  };
}

test("the gesture responder survives the grant-triggered render and later parent renders", async () => {
  const h = await mountRow();
  try {
    const initial = h.gesture();
    await act(async () => initial.onPanResponderGrant());
    assert.equal(
      h.gesture().onPanResponderRelease,
      initial.onPanResponderRelease,
    );
    await h.rerender();
    assert.equal(h.gesture().onPanResponderMove, initial.onPanResponderMove);
    assert.equal(h.gesture().onPanResponderTerminationRequest(), false);
  } finally {
    await h.close();
  }
});

test("a fully revealed left swipe stays open despite rightward release recoil and a trailing row press", async () => {
  const h = await mountRow();
  try {
    await act(async () => h.row().onPressIn?.());
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () => h.gesture().onPanResponderMove(null, { dx: -210 }));
    await act(async () =>
      h.gesture().onPanResponderRelease(null, { dx: -200, vx: 0.8 }),
    );
    assert.equal(h.actions().length, 2);
    await act(async () => h.row().onPress());
    assert.equal(
      h.actions().length,
      2,
      "release must not count as a new tap to close",
    );
    await act(async () => h.actions()[0].props.onPress());
    assert.deepEqual(h.archives, [["chat", true]]);
    assert.equal(h.navigations, 0);
  } finally {
    await h.close();
  }
});

test("small drags close, vertical scrolling is not captured, and a fresh row tap closes revealed actions", async () => {
  const h = await mountRow();
  try {
    assert.equal(
      h.gesture().onMoveShouldSetPanResponder(null, { dx: -15, dy: 50 }),
      false,
    );
    assert.equal(
      h.gesture().onMoveShouldSetPanResponder(null, { dx: -30, dy: 2 }),
      true,
    );
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () =>
      h.gesture().onPanResponderRelease(null, { dx: -25, vx: 0 }),
    );
    assert.equal(h.actions().length, 0);
    await act(async () => {
      h.row().onPressIn?.();
      h.row().onLongPress();
    });
    assert.equal(h.actions().length, 2);
    await act(async () => {
      h.row().onPressIn?.();
      h.row().onPress();
    });
    assert.equal(h.actions().length, 0);
    assert.equal(h.navigations, 0);
  } finally {
    await h.close();
  }
});

test("revealed Delete remains tappable and cancellation retains the actions and conversation", async () => {
  const h = await mountRow();
  try {
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () =>
      h.gesture().onPanResponderRelease(null, { dx: -180, vx: 0 }),
    );
    await act(async () => h.actions()[1].props.onPress());
    assert.equal(h.confirmCount, 1);
    assert.deepEqual(h.deletes, []);
    assert.equal(h.actions().length, 2);
    h.allowDelete();
    await act(async () => h.actions()[1].props.onPress());
    assert.deepEqual(h.deletes, ["chat"]);
    assert.equal(h.actions().length, 0);
  } finally {
    await h.close();
  }
});

test("the stable responder reads the latest layout and settles an interrupted drag without snapping shut", async () => {
  const h = await mountRow();
  try {
    const release = h.gesture().onPanResponderRelease;
    h.dimensions.width = 320;
    h.dimensions.fontScale = 1.4;
    await h.rerender();
    assert.equal(h.gesture().onPanResponderRelease, release);
    await act(async () => h.gesture().onPanResponderGrant());
    // New reveal width is 246.4: 100 is below half, unlike the old 176 width.
    await act(async () => release(null, { dx: -100, vx: 0 }));
    assert.equal(h.actions().length, 0);
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () => h.gesture().onPanResponderMove(null, { dx: -230 }));
    await act(async () => h.gesture().onPanResponderTerminate());
    assert.equal(h.actions().length, 2);
  } finally {
    await h.close();
  }
});

test("a short left flick opens, an intentional right drag closes, and a fresh closed-row tap opens the chat", async () => {
  const h = await mountRow();
  try {
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () =>
      h.gesture().onPanResponderRelease(null, { dx: -35, vx: -0.8 }),
    );
    assert.equal(h.actions().length, 2);
    await act(async () => h.gesture().onPanResponderGrant());
    await act(async () =>
      h.gesture().onPanResponderRelease(null, { dx: 140, vx: 0.6 }),
    );
    assert.equal(h.actions().length, 0);
    await act(async () => {
      h.row().onPressIn();
      h.row().onPress();
    });
    assert.equal(h.navigations, 1);
  } finally {
    await h.close();
  }
});
