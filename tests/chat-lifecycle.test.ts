import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import {
  createConversation,
  parseData,
  reusableConversation,
} from "../src/domain";
import { emptyData, type AppData } from "../src/types";
import {
  splitAttachmentStorage,
  hydrateAttachmentStorage,
} from "../src/attachment-storage";
import { credentialDestination } from "../src/credentials";
import { deferred, mountStore } from "./helpers/store-harness";

function fixture(): AppData {
  const connection = {
    id: "provider",
    name: "QA",
    protocol: "compatible" as const,
    provider: "custom" as const,
    baseUrl: "https://example.com/v1",
    model: "test",
  };
  const chat = createConversation(connection.id);
  chat.id = "chat";
  chat.draft = "Keep my draft";
  chat.draftAttachments = [
    {
      id: "file",
      name: "note.txt",
      mimeType: "text/plain",
      size: 4,
      data: "note",
    },
  ];
  return {
    ...emptyData(),
    defaultConnectionId: connection.id,
    connections: [connection],
    conversations: [chat],
    providerConsents: [
      {
        credentialId: connection.id,
        destination: credentialDestination(connection),
        revision: 3,
        grantedAt: 1,
        generatedImageEditChats: [chat.id, "other"],
        attachmentApprovals: [
          { conversationId: chat.id, attachmentIds: ["file"] },
          { conversationId: "other", attachmentIds: ["other-file"] },
        ],
      },
    ],
  };
}

test("archive and restore survive local storage and backup without changing chat contents or recency", async () => {
  const initial = fixture();
  const h = await mountStore(initial);
  try {
    await act(async () => h.store.archiveChat("chat", true));
    assert.deepEqual(h.saved().conversations[0], {
      ...initial.conversations[0],
      archived: true,
    });
    const stored = splitAttachmentStorage(h.saved());
    const local = parseData(
      hydrateAttachmentStorage(JSON.parse(stored.metadata), stored.blobs),
      true,
    );
    assert.equal(local.conversations[0].archived, true);
    assert.deepEqual(
      local.conversations[0].draftAttachments,
      initial.conversations[0].draftAttachments,
    );
    assert.equal(
      parseData(JSON.parse(JSON.stringify(h.saved()))).conversations[0]
        .archived,
      true,
    );
    await act(async () => h.store.archiveChat("chat", false));
    assert.deepEqual(h.saved().conversations[0], {
      ...initial.conversations[0],
      archived: false,
    });
  } finally {
    await h.close();
  }
});

test("old chats load, invalid archive flags fail, and archived blanks are never reused", () => {
  const data = fixture();
  assert.equal(parseData(data).conversations[0].archived, undefined);
  assert.throws(
    () =>
      parseData({
        ...data,
        conversations: [{ ...data.conversations[0], archived: "true" }],
      }),
    /Invalid conversation/,
  );
  data.conversations = [{ ...createConversation("provider"), archived: true }];
  assert.equal(reusableConversation(data, "provider"), undefined);
  data.conversations[0].archived = false;
  assert.equal(
    reusableConversation(data, "provider")?.id,
    data.conversations[0].id,
  );
});

test("delete removes chat and its scoped approvals and unreferenced blobs, preserving unrelated data", async () => {
  const initial = fixture();
  initial.conversations.push({
    ...createConversation("provider"),
    id: "other",
  });
  const h = await mountStore(initial);
  try {
    await act(async () => h.store.deleteChat("chat"));
    assert.deepEqual(h.saved().conversations, [initial.conversations[1]]);
    assert.deepEqual(h.saved().connections, initial.connections);
    assert.deepEqual(h.saved().agents, initial.agents);
    assert.deepEqual(h.saved().providerConsents, [
      {
        ...initial.providerConsents![0],
        generatedImageEditChats: ["other"],
        attachmentApprovals: [
          initial.providerConsents![0].attachmentApprovals![1],
        ],
      },
    ]);
    assert.equal(splitAttachmentStorage(h.saved()).blobs.size, 0);
  } finally {
    await h.close();
  }
});

test("failed archive or delete writes keep the chat and attachments available for retry", async () => {
  let fail = false;
  const h = await mountStore(fixture(), {
    write: async () => {
      if (fail) throw new Error("disk full");
    },
  });
  try {
    const before = h.saved();
    fail = true;
    await act(async () => {
      await assert.rejects(h.store.archiveChat("chat", true), /Could not save/);
      await assert.rejects(h.store.deleteChat("chat"), /Could not save/);
    });
    assert.deepEqual(h.saved(), before);
    assert.deepEqual(h.store.data, before);
    fail = false;
    await act(async () => h.store.archiveChat("chat", true));
    assert.equal(h.saved().conversations[0].archived, true);
    await act(async () => h.store.deleteChat("chat"));
    assert.equal(h.saved().conversations.length, 0);
  } finally {
    await h.close();
  }
});

test("a deleting chat cannot begin a provider request while the deletion write is pending", async () => {
  const started = deferred();
  const release = deferred();
  let block = false;
  const h = await mountStore(fixture(), {
    write: async () => {
      if (block) {
        started.resolve();
        await release.promise;
      }
    },
  });
  try {
    block = true;
    let deletion!: Promise<void>;
    await act(async () => {
      deletion = h.store.deleteChat("chat");
      await started.promise;
      await assert.rejects(h.store.send("chat", "hello"), /being deleted/);
      release.resolve();
      await deletion;
    });
    assert.equal(h.requests.length, 0);
    assert.equal(h.saved().conversations.length, 0);
  } finally {
    release.resolve();
    await h.close();
  }
});

test("archive preserves a live reply; delete refuses until the reply has stopped", async () => {
  const h = await mountStore(fixture());
  try {
    let response!: Promise<void>;
    await act(async () => {
      response = h.store.send("chat", "hello");
    });
    assert.equal(h.requests.length, 1);
    await act(async () => {
      await assert.rejects(h.store.deleteChat("chat"), /Stop this chat/);
      await h.store.archiveChat("chat", true);
      h.requests[0].request.onText("Still replying");
      h.requests[0].done.resolve();
      await response;
    });
    assert.equal(h.saved().conversations[0].archived, true);
    assert.equal(
      h.saved().conversations[0].messages.at(-1)?.text,
      "Still replying",
    );
    await act(async () => h.store.deleteChat("chat"));
    assert.equal(h.saved().conversations.length, 0);
  } finally {
    await h.close();
  }
});

test("deleting one chat retains attachments still referenced by another chat", async () => {
  const initial = fixture();
  initial.conversations.push({
    ...createConversation("provider"),
    id: "other",
    draftAttachments: initial.conversations[0].draftAttachments,
  });
  const h = await mountStore(initial);
  try {
    await act(async () => h.store.deleteChat("chat"));
    const { metadata, blobs } = splitAttachmentStorage(h.saved());
    assert.equal(blobs.get("file"), "note");
    const restored = parseData(
      hydrateAttachmentStorage(JSON.parse(metadata), blobs),
      true,
    );
    assert.deepEqual(
      restored.conversations[0].draftAttachments,
      initial.conversations[0].draftAttachments,
    );
  } finally {
    await h.close();
  }
});

test("live device check chats cannot be archived or deleted", async () => {
  const initial = fixture();
  initial.deviceCheck = {
    agentId: "test-agent",
    streamChatId: "chat",
    recallChatId: "test-recall",
    connectionId: "provider",
    word: "QA",
    sessionId: "session",
    createdAt: 1,
  };
  const h = await mountStore(initial);
  try {
    await act(async () => {
      await assert.rejects(
        h.store.archiveChat("chat", true),
        /Live device check/,
      );
      await assert.rejects(h.store.deleteChat("chat"), /Live device check/);
    });
    assert.deepEqual(h.saved(), initial);
  } finally {
    await h.close();
  }
});
