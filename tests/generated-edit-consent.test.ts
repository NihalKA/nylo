import test from "node:test";
import assert from "node:assert/strict";
import { emptyData, Attachment, Connection } from "../src/types";
import { createConversation, parseData } from "../src/domain";
import { credentialDestination } from "../src/credentials";
import {
  generatedEditApproved,
  rememberGeneratedEdits,
} from "../src/generated-edit-consent";
const connection: Connection = {
  id: "provider",
  name: "QA",
  provider: "custom",
  protocol: "openai",
  baseUrl: "https://example.com/v1",
  model: "qa",
};
const image: Attachment = {
  id: "image-one",
  name: "QA.png",
  mimeType: "image/png",
  size: 12,
  data: "iVBORw0KGgoAAAAA",
};
function fixture() {
  const data = emptyData();
  data.connections = [connection];
  data.defaultConnectionId = connection.id;
  const chat = createConversation(connection.id);
  chat.messages = [
    {
      id: "reply-one",
      role: "assistant",
      text: "",
      status: "complete",
      createdAt: 1,
      generatedFiles: [image],
    },
  ];
  data.conversations = [chat];
  data.providerConsents = [
    {
      credentialId: connection.id,
      destination: credentialDestination(connection),
      revision: 3,
      grantedAt: 1,
    },
  ];
  return { data, id: chat.id };
}
test("generated edit approval persists only locally for this chat and provider, reset/import fail closed", () => {
  const { data, id } = fixture();
  assert.equal(generatedEditApproved(data, id, connection, image), false);
  data.providerConsents = rememberGeneratedEdits(data, id, connection);
  assert.equal(
    generatedEditApproved(parseData(data, true), id, connection, image),
    true,
  );
  for (const changed of [
    { ...connection, credentialId: "other-key" },
    { ...connection, baseUrl: "https://other.example/v1" },
    { ...connection, protocol: "anthropic" as const },
  ])
    assert.equal(generatedEditApproved(data, id, changed, image), false);
  assert.equal(
    generatedEditApproved(data, "another-chat", connection, image),
    false,
  );
  assert.equal(
    generatedEditApproved(parseData(data), id, connection, image),
    false,
  );
  data.providerConsents = [];
  assert.equal(generatedEditApproved(data, id, connection, image), false);
});
test("personal uploads and same-ID replacement bytes never inherit generated-image permission", () => {
  const { data, id } = fixture();
  data.providerConsents = rememberGeneratedEdits(data, id, connection);
  assert.equal(
    generatedEditApproved(data, id, connection, {
      ...image,
      data: image.data + "AAAA",
    }),
    false,
  );
  data.conversations[0].messages[0].generatedFiles = [];
  data.conversations[0].messages.push({
    id: "user-one",
    role: "user",
    text: "Edit",
    status: "complete",
    createdAt: 2,
    attachments: [image],
  });
  assert.equal(generatedEditApproved(data, id, connection, image), false);
});
