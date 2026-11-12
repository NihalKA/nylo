import React, { act } from "react";
import { create, ReactTestRenderer } from "react-test-renderer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import type { AppData } from "../../src/types";
import type { runSDKAgent } from "../../src/sdk-engine";
import { createApprovalQueue } from "../../src/approval-queue";

type Store = ReturnType<typeof import("../../src/store").useStore>;
export type SDKRequest = Parameters<typeof runSDKAgent>[0];
import { deferred } from "./deferred";
export { deferred } from "./deferred";

// Run the actual StoreProvider with React, swapping only platform/network I/O.
// Transpilation avoids importing React Native's native-only entry point in Node.
export async function mountStore(
  initial: AppData,
  options: {
    readKey?: () => Promise<string>;
    write?: (data: AppData) => Promise<void>;
    permission?: (title: string, message: string) => Promise<boolean>;
    background?: (token: string) => boolean;
  } = {},
) {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  let persisted = structuredClone(initial);
  let store!: Store;
  let onAppState: ((state: string) => void) | undefined;
  const requests: {
    request: SDKRequest;
    done: ReturnType<typeof deferred<void>>;
  }[] = [];
  const released: string[] = [];
  const appState = {
    currentState: "active",
    addEventListener: (_: string, listener: typeof onAppState) => {
      onAppState = listener;
      return {
        remove: () => {
          onAppState = undefined;
        },
      };
    },
  };
  const approve = createApprovalQueue(() => appState.currentState === "active");
  const modules: Record<string, unknown> = {
    "react-native": { AppState: appState },
    "./storage": {
      readData: async () => structuredClone(initial),
      writeData: async (data: AppData) => {
        await options.write?.(data);
        persisted = structuredClone(data);
      },
      readKey: options.readKey || (async () => "synthetic-test-key"),
      writeKey: async () => {},
      removeKey: async () => {},
    },
    "./sdk-engine": {
      runSDKAgent: (request: SDKRequest) => {
        const done = deferred();
        requests.push({ request, done });
        const abort = () => done.reject(new Error("Response stopped."));
        request.signal.addEventListener("abort", abort, { once: true });
        if (request.signal.aborted) abort();
        return done.promise.finally(() =>
          request.signal.removeEventListener("abort", abort),
        );
      },
    },
    "./transport": {
      streamingFetch: () => {
        throw new Error("Unexpected network request");
      },
    },
    "./background-response": {
      beginBackgroundResponse: async (token: string) => ({
        held: options.background?.(token) ?? true,
        release: () => released.push(token),
      }),
    },
    "./consent": {
      askPermission: (
        title: string,
        message: string,
        _: string,
        signal?: AbortSignal,
      ) =>
        approve(
          () => options.permission?.(title, message) ?? Promise.resolve(true),
          false,
          signal,
        ),
      askImageEditPermission: (_: string, __: boolean, signal?: AbortSignal) =>
        approve(async () => "once", "cancel", signal),
    },
  };
  const source = new URL("../../src/store.tsx", import.meta.url);
  const compiled = ts.transpileModule(readFileSync(source, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const actualRequire = createRequire(source);
  const exported = { exports: {} as typeof import("../../src/store") };
  new Function("require", "module", "exports", compiled)(
    (id: string) => modules[id] ?? actualRequire(id),
    exported,
    exported.exports,
  );
  function Probe() {
    store = exported.exports.useStore();
    return null;
  }
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      React.createElement(
        exported.exports.StoreProvider,
        null,
        React.createElement(Probe),
      ),
    );
  });
  return {
    get store() {
      return store;
    },
    requests,
    released,
    saved: () => persisted,
    background: async () => {
      await act(async () => {
        appState.currentState = "background";
        onAppState?.("background");
      });
    },
    close: async () => {
      await act(async () => renderer.unmount());
    },
  };
}
