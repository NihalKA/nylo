import test from "node:test";
import assert from "node:assert/strict";
import {
  pendingAttachmentApproval,
  rememberAttachmentApproval,
} from "../src/attachment-consent";
import { credentialDestination } from "../src/credentials";
import { createConversation, parseData } from "../src/domain";
import { Attachment, Connection, emptyData } from "../src/types";

const connection: Connection = {
  id: "provider",
  protocol: "openai",
  provider: "custom",
  baseUrl: "https://example.com/v1",
  name: "QA",
  model: "one",
};
const pdf: Attachment = {
  id: "pdf-one",
  name: "QA.pdf",
  mimeType: "application/pdf",
  size: 8,
  data: "JVBERi0xLjc=",
};
function fixture() {
  const data = emptyData();
  data.connections = [connection];
  data.defaultConnectionId = connection.id;
  data.conversations = [createConversation(connection.id)];
  data.providerConsents = [
    {
      credentialId: connection.id,
      destination: credentialDestination(connection),
      revision: 3,
      grantedAt: 1,
    },
  ];
  return data;
}
test("first file needs approval; accepted follow-ups and retries reuse it after local restart", () => {
  let data = fixture();
  const id = data.conversations[0].id;
  assert.deepEqual(pendingAttachmentApproval(data, id, connection, [pdf]), [
    pdf,
  ]);
  // Merely preparing or cancelling a send must not grant consent.
  assert.deepEqual(pendingAttachmentApproval(data, id, connection, [pdf]), [
    pdf,
  ]);
  data.providerConsents = rememberAttachmentApproval(data, id, connection, [
    pdf,
  ]);
  data = parseData(JSON.parse(JSON.stringify(data)), true);
  for (let i = 0; i < 3; i++)
    assert.deepEqual(
      pendingAttachmentApproval(data, id, connection, [pdf]),
      [],
    );
  const newFile = { ...pdf, id: "pdf-two" };
  assert.deepEqual(
    pendingAttachmentApproval(data, id, connection, [pdf, newFile]),
    [newFile],
  );
  assert.deepEqual(
    pendingAttachmentApproval(data, "another-chat", connection, [pdf]),
    [pdf],
  );
});
test("provider, credential, protocol changes, imports and permission reset require fresh file approval", () => {
  const data = fixture();
  const id = data.conversations[0].id;
  data.providerConsents = rememberAttachmentApproval(data, id, connection, [
    pdf,
  ]);
  for (const changed of [
    { ...connection, baseUrl: "https://other.example/v1" },
    { ...connection, credentialId: "new-key" },
    { ...connection, protocol: "anthropic" as const },
  ])
    assert.deepEqual(pendingAttachmentApproval(data, id, changed, [pdf]), [
      pdf,
    ]);
  assert.deepEqual(
    pendingAttachmentApproval(parseData(data), id, connection, [pdf]),
    [pdf],
  );
  data.providerConsents = [];
  assert.deepEqual(pendingAttachmentApproval(data, id, connection, [pdf]), [
    pdf,
  ]);
  data.providerConsents = fixture().providerConsents;
  assert.deepEqual(pendingAttachmentApproval(data, id, connection, [pdf]), [
    pdf,
  ]);
});
test("malformed saved approval fails closed and no provider approval is invented", () => {
  const data = fixture();
  const id = data.conversations[0].id;
  (data.providerConsents![0] as any).attachmentApprovals = [
    { conversationId: id, attachmentIds: [null] },
  ];
  assert.deepEqual(
    pendingAttachmentApproval(parseData(data, true), id, connection, [pdf]),
    [pdf],
  );
  data.providerConsents = [];
  assert.deepEqual(rememberAttachmentApproval(data, id, connection, [pdf]), []);
});
