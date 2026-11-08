import { test } from "node:test";
import assert from "node:assert/strict";
import {
  credentialDestination,
  decodeCredential,
  encodeCredential,
} from "../src/credentials";
import { parseData } from "../src/domain";
import { emptyData } from "../src/types";
test("a stored credential can only be used with its exact normalized protocol and destination", () => {
  const destination = credentialDestination({
    protocol: "compatible",
    baseUrl: "https://EXAMPLE.invalid/v1/",
  });
  assert.equal(destination, "compatible:https://example.invalid/v1");
  const raw = encodeCredential("fixture-key", destination);
  assert.equal(decodeCredential(raw, destination), "fixture-key");
  assert.equal(
    decodeCredential(raw, "compatible:https://other.invalid/v1"),
    null,
  );
  assert.equal(
    decodeCredential(raw, "openai:https://example.invalid/v1"),
    null,
  );
  assert.equal(decodeCredential("old-unbound-key", destination), null);
  assert.equal(decodeCredential(null, destination), null);
});
test("credential references persist locally but are stripped from exported or imported backups", () => {
  const value = {
    ...emptyData(),
    retiredCredentialIds: ["retired-1"],
    connections: [
      {
        id: "connection-1",
        name: "Custom",
        protocol: "compatible",
        baseUrl: "https://example.invalid/v1",
        model: "fixture-model",
        credentialId: "credential-1",
      },
    ],
  };
  const local = parseData(value, true);
  assert.equal(local.connections[0].credentialId, "credential-1");
  assert.deepEqual(local.retiredCredentialIds, ["retired-1"]);
  const backup = parseData(local);
  assert.equal(backup.connections[0].credentialId, undefined);
  assert.deepEqual(backup.retiredCredentialIds, []);
  assert.doesNotMatch(JSON.stringify(backup), /credential-1|retired-1/);
});
