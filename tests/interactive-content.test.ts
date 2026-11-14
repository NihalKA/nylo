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
