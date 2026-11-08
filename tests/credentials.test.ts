import { test } from "node:test";
import assert from "node:assert/strict";
import {
  credentialDestination,
  decodeCredential,
  encodeCredential,
  stageCredential,
} from "../src/credentials";
import { parseData } from "../src/domain";
import { emptyData } from "../src/types";
test("staged credentials remain discoverable at every failed save boundary", async () => {
  for (const boundary of ["journal", "write", "activate"] as const) {
    let journal: string[] = [];
    let secret: string | null = null;
    let active = "old-slot";
    await assert.rejects(
      stageCredential({
        journal: async () => {
          if (boundary === "journal") throw new Error("disk full");
          journal = ["new-slot"];
        },
        write: async () => {
          assert.deepEqual(journal, ["new-slot"]);
          secret = "fixture-secret";
          if (boundary === "write") throw new Error("interrupted write");
        },
        activate: async () => {
          if (boundary === "activate") throw new Error("metadata write failed");
          active = "new-slot";
          journal = [];
        },
        rollback: async () => {
          throw new Error("secure deletion unavailable");
        },
      }),
    );
    assert.equal(active, "old-slot");
    if (secret)
      assert.deepEqual(journal, ["new-slot"], "startup can retry deletion");
    else assert.deepEqual(journal, []);
  }
});
test("credential journaling precedes secret storage and activation", async () => {
  const operations: string[] = [];
  await stageCredential({
    journal: async () => {
      operations.push("journal");
    },
    write: async () => {
      operations.push("write");
    },
    activate: async () => {
      operations.push("activate");
    },
    rollback: async () => {
      operations.push("rollback");
    },
  });
  assert.deepEqual(operations, ["journal", "write", "activate"]);
});
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
test("sharing permissions stay local and cannot be granted by importing a backup", () => {
  const value = {
    ...emptyData(),
    providerConsents: [
      {
        credentialId: "test-slot",
        destination: "openai:https://example.invalid/v1",
        revision: 1,
        grantedAt: 1,
      },
    ],
  };
  assert.equal(parseData(value, true).providerConsents?.length, 1);
  assert.deepEqual(parseData(value).providerConsents, []);
});
