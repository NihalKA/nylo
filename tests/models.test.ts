import { test } from "node:test";
import assert from "node:assert/strict";
import { listModels } from "../src/models";
import { Connection } from "../src/types";
const connection: Connection = {
  id: "models-test",
  name: "Custom",
  protocol: "compatible",
  baseUrl: "https://example.invalid/v1",
  model: "",
};
test("model discovery authenticates only to the direct HTTPS endpoint and normalizes IDs", async () => {
  const result = await listModels(
    connection,
    "fixture-key",
    async (url, options) => {
      assert.equal(url, "https://example.invalid/v1/models");
      assert.equal(options?.redirect, "error");
      assert.equal(
        (options?.headers as Record<string, string>).Authorization,
        "Bearer fixture-key",
      );
      assert.equal(options?.body, undefined);
      return Response.json({
        data: [{ id: "z" }, { id: "a" }, { id: "a" }, { nope: 1 }],
      });
    },
  );
  assert.deepEqual(result, ["a", "z"]);
});
test("model discovery rejects plaintext endpoints before transmitting credentials", async () => {
  await assert.rejects(
    listModels(
      { ...connection, baseUrl: "http://example.invalid" },
      "fixture-key",
      async () => {
        assert.fail("must not send");
      },
    ),
    /HTTPS/,
  );
});
test("model discovery never exposes a provider error body or thrown credential", async () => {
  await assert.rejects(
    listModels(
      connection,
      "fixture-key",
      async () =>
        new Response("private provider error fixture-key", { status: 401 }),
    ),
    (error) =>
      !String(error).includes("fixture-key") && /rejected/.test(String(error)),
  );
  await assert.rejects(
    listModels(connection, "fixture-key", async () => {
      throw new Error("fixture-key");
    }),
    (error) => !String(error).includes("fixture-key"),
  );
});
test("model discovery rejects malformed responses without inventing a model", async () => {
  await assert.rejects(
    listModels(connection, "fixture-key", async () =>
      Response.json({ data: [] }),
    ),
    /No models/,
  );
  await assert.rejects(
    listModels(connection, "fixture-key", async () =>
      Response.json({ message: "bad" }),
    ),
    /model list/,
  );
});
test("built-in provider branding cannot use a custom credential destination", async () => {
  await assert.rejects(
    listModels(
      { ...connection, protocol: "openai" },
      "fixture-key",
      async () => {
        assert.fail("must not send");
      },
    ),
    /Custom provider/,
  );
  await assert.rejects(
    listModels(
      { ...connection, protocol: "anthropic" },
      "fixture-key",
      async () => {
        assert.fail("must not send");
      },
    ),
    /Custom provider/,
  );
});
test("credential destination comparison tolerates trailing slash only", async () => {
  const { sameDestination } = await import("../src/domain");
  assert.equal(
    sameDestination(connection, {
      ...connection,
      baseUrl: connection.baseUrl + "/",
    }),
    true,
  );
  assert.equal(
    sameDestination(connection, {
      ...connection,
      baseUrl: "https://other.invalid/v1",
    }),
    false,
  );
  assert.equal(
    sameDestination(connection, { ...connection, protocol: "openai" }),
    false,
  );
});
