import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as lifetime from "../src/response-lifetime";

// Exercise the production platform selector, not a mock of beginBackgroundResponse.
for (const platform of ["android", "ios", "web"]) {
  test(`${platform} uses native response protection only where supported`, async () => {
    let starts = 0;
    let ends = 0;
    const exported = {
      exports: {} as typeof import("../src/background-response"),
    };
    const source = readFileSync(
      new URL("../src/background-response.ts", import.meta.url),
      "utf8",
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function("require", "module", "exports", compiled)(
      (id: string) => {
        if (id === "react-native") return { Platform: { OS: platform } };
        if (id === "./response-lifetime") return lifetime;
        if (id === "expo")
          return {
            requireOptionalNativeModule: () => ({
              begin: async () => {
                starts++;
                return true;
              },
              end: async () => {
                ends++;
              },
              addListener: () => ({ remove() {} }),
            }),
          };
        throw new Error(`Unexpected import ${id}`);
      },
      exported,
      exported.exports,
    );
    const lease = await exported.exports.beginBackgroundResponse(
      "response",
      () => assert.fail("Unexpected expiry"),
      new AbortController().signal,
    );
    assert.equal(lease.held, platform !== "web");
    assert.equal(starts, platform === "web" ? 0 : 1);
    lease.release();
    assert.equal(ends, platform === "web" ? 0 : 1);
  });
}
