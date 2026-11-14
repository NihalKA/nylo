import test from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import {
  readInteractiveReply,
  type ReplyValues,
} from "../src/interactive-reply";

// Exercise the real OpenUI native renderer, replacing only RN host primitives.
function loadContent() {
  const require = createRequire(import.meta.url);
  const native = {
    View: "View",
    Text: "Text",
    Pressable: "Pressable",
    ScrollView: "ScrollView",
    ActivityIndicator: "ActivityIndicator",
    Modal: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: React.ReactNode;
    }) =>
      visible ? React.createElement(React.Fragment, null, children) : null,
    Platform: { OS: "ios" },
    Keyboard: { dismiss() {} },
    AppState: { addEventListener: () => ({ remove() {} }) },
  };
  const nativePath = path.join(
    path.dirname(require.resolve("@openuidev/react-lang")),
    "index.native.cjs",
  );
  const lib = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    readFileSync(nativePath, "utf8"),
  )(
    (name: string) => (name === "react-native" ? native : require(name)),
    lib,
    lib.exports,
  );
  const modules: Record<string, unknown> = {
    react: React,
    "react-native": native,
    "@openuidev/react-lang": lib.exports,
    "./typography": { Text: "Text", TextInput: "TextInput" },
    "./ui": { Button: "Button" },
    "./theme": { theme: { ink: "black", primary: "blue" } },
    "./rich-blocks": { DataTable: "DataTable" },
    "./reply-date-picker": { __esModule: true, default: "DatePicker" },
    "./message-content": { MessageContent: "MessageContent" },
  };
  const filename = path.resolve("src/interactive-content.tsx");
  const localRequire = createRequire(filename);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const m = { exports: {} as typeof import("../src/interactive-content") };
  new Function("require", "module", "exports", output)(
    (name: string) => modules[name] || localRequire(name),
    m,
    m.exports,
  );
  return m.exports.InteractiveContent;
}
const source = `root = Root([Select("category", "Category", ["All", "Food", "Travel"], "All"), Chart("Sample", "line", [{label:"Lunch",value:10,category:"Food"},{label:"Bus",value:5,category:"Travel"}], "category"), Table(["Item", "Category"], [["Lunch", "Food"], ["Bus", "Travel"]], "category", 1), Slider("budget", "Budget", 0, 100, 10, 50), Input("goal", "Goal", "", true), Submit("Continue", "Use my choices")])`;
test("native OpenUI controls filter existing table/chart locally, persist and explicitly submit once", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const Content = loadContent();
  const reply = readInteractiveReply({
    version: 1,
    source,
    fallback: "Sample data",
    values: {},
  })!;
  const saved: ReplyValues[] = [];
  const submissions: ReplyValues[] = [];
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      React.createElement(Content, {
        reply,
        disabled: false,
        onSave: async (v) => {
          saved.push(v);
        },
        onSubmit: async (v) => {
          submissions.push(v);
        },
      }),
    );
  });
  try {
    assert.equal(
      tree.root.findByType("DataTable" as React.ElementType).props.table.rows
        .length,
      2,
    );
    await act(async () => {
      tree.root.findByProps({ accessibilityLabel: "Food" }).props.onPress();
    });
    assert.equal(
      tree.root.findByType("DataTable" as React.ElementType).props.table.rows
        .length,
      1,
    );
    assert.equal(
      tree.root.findAllByProps({ accessibilityLabel: "Bus: 5" }).length,
      0,
    );
    assert.equal(submissions.length, 0);
    await act(async () => {
      tree.root
        .findByType("TextInput" as React.ElementType)
        .props.onChangeText("A quiet trip");
    });
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: "Increase Budget" })
        .props.onPress();
    });
    assert.equal(saved.at(-1)?.budget, 60);
    const press = tree.root.findByProps({ title: "Continue" }).props.onPress;
    await act(async () => {
      press();
      press();
    });
    assert.equal(submissions.length, 1);
    assert.deepEqual(submissions[0], {
      category: "Food",
      budget: 60,
      goal: "A quiet trip",
    });
    await act(async () => {
      tree.unmount();
    });
    await act(async () => {
      tree = create(
        React.createElement(Content, {
          reply: { ...reply, values: saved.at(-1)! },
          disabled: true,
          onSave: async () => assert.fail(),
          onSubmit: async () => assert.fail(),
        }),
      );
    });
    assert.equal(
      tree.root.findByType("TextInput" as React.ElementType).props.value,
      "A quiet trip",
    );
    assert.equal(
      tree.root.findByType("TextInput" as React.ElementType).props.editable,
      false,
    );
    assert.equal(
      tree.root.findByProps({ title: "Continue" }).props.disabled,
      true,
    );
  } finally {
    await act(async () => tree.unmount());
  }
});

test("calculator updates locally with exact edits, rejects ambiguous input and restores persisted values", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const Content = loadContent();
  const source =
    'root = Root([Number("p","Amount",0,10000,100,1000,"INR"),Metric("Double","$p*2"),Submit("Send","Use amount")])';
  const reply = readInteractiveReply({
    version: 2,
    source,
    fallback: "Adjust amount",
    values: {},
  })!;
  const saved: ReplyValues[] = [];
  let requests = 0;
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      React.createElement(Content, {
        reply,
        disabled: false,
        onSave: async (v) => {
          saved.push(v);
        },
        onSubmit: async () => {
          requests++;
        },
      }),
    );
  });
  const json = () => JSON.stringify(tree.toJSON());
  try {
    assert.match(json(), /2,000/);
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onFocus();
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onChangeText("1234.5");
    });
    assert.match(json(), /2,469/);
    assert.equal(requests, 0);
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onChangeText("1,000");
    });
    assert.equal(tree.root.findByProps({ title: "Send" }).props.disabled, true);
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onBlur();
    });
    assert.equal(tree.root.findByProps({ title: "Send" }).props.disabled, true);
    await act(async () => {
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onChangeText("2500");
      tree.root
        .findByProps({ accessibilityLabel: "Exact Amount" })
        .props.onBlur();
    });
    assert.match(json(), /5,000/);
    assert.equal(saved.at(-1)?.p, 2500);
    assert.equal(requests, 0);
  } finally {
    await act(async () => tree.unmount());
  }
});
test("calendar selection cancels safely, commits only on Use date, and enforces date order", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const Content = loadContent();
  const reply = readInteractiveReply({
    version: 2,
    source:
      'root = Root([DateInput("start","Start","",true),DateInput("end","End","",true,"start"),Submit("Plan","Plan a trip")])',
    fallback: "Pick dates",
    values: {},
  })!;
  const saved: ReplyValues[] = [];
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      React.createElement(Content, {
        reply,
        disabled: false,
        onSave: async (v) => {
          saved.push(v);
        },
        onSubmit: async () => {},
      }),
    );
  });
  try {
    const press = async (label: string) => {
      await act(async () =>
        tree.root.findByProps({ accessibilityLabel: label }).props.onPress(),
      );
    };
    await press("Choose Start");
    await act(async () =>
      tree.root
        .findByType("DatePicker" as React.ElementType)
        .props.onChange({ type: "set" }, new Date(2026, 11, 20, 12)),
    );
    assert.equal(saved.length, 0);
    await act(async () =>
      tree.root.findByProps({ title: "Cancel date selection" }).props.onPress(),
    );
    assert.equal(saved.length, 0);
    await press("Choose Start");
    await act(async () =>
      tree.root
        .findByType("DatePicker" as React.ElementType)
        .props.onChange({ type: "set" }, new Date(2026, 11, 20, 12)),
    );
    await act(async () =>
      tree.root.findAllByProps({ title: "Use date" })[0].props.onPress(),
    );
    assert.equal(saved.at(-1)?.start, "2026-12-20");
    assert.equal(tree.root.findByProps({ title: "Plan" }).props.disabled, true);
    await press("Choose End");
    assert.equal(
      tree.root
        .findByType("DatePicker" as React.ElementType)
        .props.minimumDate.getDate(),
      20,
    );
  } finally {
    await act(async () => tree.unmount());
  }
});

test("captured LB calculator and planner render with real OpenUI native composition", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const Content = loadContent();
  const fixture = JSON.parse(
    readFileSync("e2e/fixtures/interactive-model-output.json", "utf8"),
  );
  for (const id of ["loan", "travel-v2"]) {
    const reply = readInteractiveReply(
      fixture.cases.find((c: { id: string }) => c.id === id).reply,
    )!;
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(
        React.createElement(Content, {
          reply,
          disabled: false,
          onSave: async () => {},
          onSubmit: async () => assert.fail("unexpected request"),
        }),
      );
    });
    try {
      if (id === "loan") {
        assert.equal(
          tree.root.findAllByType("TextInput" as React.ElementType).length,
          3,
        );
        assert.match(JSON.stringify(tree.toJSON()), /1,288[.]37/);
      } else {
        assert.equal(
          tree.root.findAllByProps({
            accessibilityLabel: "Choose Departure date (optional)",
          }).length,
          1,
        );
        assert.equal(
          tree.root.findAllByProps({
            accessibilityLabel: "Choose Return date (optional)",
          }).length,
          1,
        );
      }
    } finally {
      await act(async () => tree.unmount());
    }
  }
});

test("collapsing optional numeric edits discards draft and clears its host validation together", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const Content = loadContent();
  const reply = readInteractiveReply({
    version: 2,
    source:
      'root = Root([Details("Options",[Number("optional","Optional",0,100,1,10)]),Submit("Send","Use choices")])',
    fallback: "Options",
    values: {},
  })!;
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      React.createElement(Content, {
        reply,
        disabled: false,
        onSave: async () => {},
        onSubmit: async () => {},
      }),
    );
  });
  try {
    await act(async () =>
      tree.root.findByProps({ title: "Show Options" }).props.onPress(),
    );
    await act(async () =>
      tree.root
        .findByProps({ accessibilityLabel: "Exact Optional" })
        .props.onChangeText("bad"),
    );
    assert.equal(tree.root.findByProps({ title: "Send" }).props.disabled, true);
    await act(async () =>
      tree.root.findByProps({ title: "Hide Options" }).props.onPress(),
    );
    assert.equal(
      tree.root.findByProps({ title: "Send" }).props.disabled,
      false,
    );
    await act(async () =>
      tree.root.findByProps({ title: "Show Options" }).props.onPress(),
    );
    assert.equal(
      tree.root.findByProps({ accessibilityLabel: "Exact Optional" }).props
        .value,
      "10",
    );
    assert.equal(
      tree.root.findByProps({ title: "Send" }).props.disabled,
      false,
    );
  } finally {
    await act(async () => tree.unmount());
  }
});
