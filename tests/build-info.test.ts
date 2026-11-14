import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function loadBuildInfo(application: {
  nativeApplicationVersion: string | null;
  nativeBuildVersion: string | null;
}) {
  const source = readFileSync(
    new URL("../src/build-info.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} as typeof import("../src/build-info") };
  new Function("require", "module", "exports", compiled)(
    (id: string) => {
      if (id === "expo-application") return application;
      // expo-constants has no nativeBuildVersion. Its manifest may also be stale.
      if (id === "expo-constants")
        return { expoConfig: { version: "0.9.0", ios: { buildNumber: "1" } } };
      throw new Error(`Unexpected import ${id}`);
    },
    module,
    module.exports,
  );
  return module.exports.buildInfo;
}

for (const [platform, build] of [
  ["iOS", "43"],
  ["Android", "45"],
]) {
  test(`${platform} Settings metadata uses the installed native version and build`, () => {
    const info = loadBuildInfo({
      nativeApplicationVersion: "1.0.0",
      nativeBuildVersion: build,
    });
    assert.equal(info.version, "1.0.0");
    assert.equal(info.build, build);
  });
}

test("web metadata does not invent a native build number", () => {
  const info = loadBuildInfo({
    nativeApplicationVersion: null,
    nativeBuildVersion: null,
  });
  assert.equal(info.version, "0.9.0");
  assert.equal(info.build, null);
});
