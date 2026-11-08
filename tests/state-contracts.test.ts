import test from "node:test";
import assert from "node:assert/strict";
import { prepareSend } from "../src/send-plan";
import { utf8Size, assertBackupSize, BACKUP_LIMIT } from "../src/byte-size";
import { processAttachmentBatch } from "../src/attachment-batch";
import { attachmentFlowReducer, AttachmentFlow } from "../src/attachment-flow";
import { modelCatalogReducer, ModelCatalog } from "../src/model-catalog";
import { createConversation } from "../src/domain";
import { Attachment, emptyData } from "../src/types";
const photo: Attachment = {
  id: "owned-photo",
  name: "QA.png",
  mimeType: "image/png",
  size: 8,
  data: "iVBORw0KGgo=",
};
function fixture() {
  const data = emptyData();
  data.connections = [
    {
      id: "provider",
      name: "QA",
      protocol: "openai",
      provider: "custom",
      baseUrl: "https://example.invalid/v1",
      model: "one",
    },
  ];
  data.defaultConnectionId = "provider";
  const conversation = {
    ...createConversation("provider"),
    id: "chat",
    draft: "Review this",
    draftAttachments: [photo],
  };
  data.conversations = [conversation];
  return data;
}
test("send preparation rejects oversized text before any history/draft mutation", () => {
  const data = fixture();
  const text = "x".repeat(90000);
  data.conversations[0].draftAttachments = [
    {
      id: "oversized-text",
      name: "large.txt",
      mimeType: "text/plain",
      size: text.length,
      data: text,
    },
  ];
  const before = JSON.stringify(data);
  assert.throws(
    () => prepareSend(data, "chat", "Review this"),
    /too much text/,
  );
  assert.equal(JSON.stringify(data), before);
});
test("cumulative context overflow leaves the new attachment editable and accepted history untouched", () => {
  const data = fixture();
  const bytes = Buffer.alloc(2 * 1024 * 1024);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  const large = {
    ...photo,
    size: bytes.length,
    data: bytes.toString("base64"),
  };
  data.conversations[0].messages = Array.from({ length: 4 }, (_, i) => ({
    id: `old-${i}`,
    role: "user",
    text: "Earlier image",
    attachments: [large],
    status: "complete",
    createdAt: i,
  }));
  const before = JSON.stringify(data);
  assert.throws(() => prepareSend(data, "chat", "Review this"), /8 MB/);
  assert.equal(JSON.stringify(data), before);
});
test("prepared send contains exact prospective context without accepting the draft", () => {
  const data = fixture();
  const before = JSON.stringify(data);
  const prepared = prepareSend(data, "chat", "Review this");
  assert.equal(prepared.messages.length, 1);
  assert.deepEqual(prepared.messages[0].attachments, [photo]);
  assert.equal(JSON.stringify(data), before);
  assert.equal(data.conversations[0].messages.length, 0);
});
test("picker waits for native dismissal and ignores duplicate starts and stale completion", () => {
  let state: AttachmentFlow = { kind: "idle" };
  state = attachmentFlowReducer(state, { type: "open" });
  state = attachmentFlowReducer(state, {
    type: "choose",
    source: "photos",
    operation: "first",
    waitForDismiss: true,
  });
  assert.equal(state.kind, "closing");
  assert.equal(
    attachmentFlowReducer(state, {
      type: "choose",
      source: "camera",
      operation: "second",
      waitForDismiss: true,
    }),
    state,
  );
  assert.equal(
    attachmentFlowReducer(state, { type: "finished", operation: "first" }),
    state,
  );
  state = attachmentFlowReducer(state, { type: "dismissed" });
  assert.equal(state.kind, "picking");
  assert.equal(
    attachmentFlowReducer(state, { type: "finished", operation: "stale" }),
    state,
  );
  state = attachmentFlowReducer(state, {
    type: "finished",
    operation: "first",
  });
  assert.deepEqual(state, { kind: "idle" });
});
test("cancelled attachment menu cannot launch a picker; Android starts without iOS dismissal", () => {
  const cancelled = attachmentFlowReducer({ kind: "menu" }, { type: "cancel" });
  assert.equal(
    attachmentFlowReducer(cancelled, { type: "dismissed" }),
    cancelled,
  );
  assert.equal(
    attachmentFlowReducer(
      { kind: "menu" },
      {
        type: "choose",
        source: "files",
        operation: "android",
        waitForDismiss: false,
      },
    ).kind,
    "picking",
  );
});
test("catalog distinguishes refresh from saved selection and refuses stale results after credential change", () => {
  let state: ModelCatalog = { kind: "unloaded", revision: 1 };
  assert.equal(
    modelCatalogReducer(state, {
      type: "loaded",
      revision: 1,
      models: ["unrequested"],
    }),
    state,
  );
  state = modelCatalogReducer(state, { type: "load", revision: 1 });
  state = modelCatalogReducer(state, { type: "reset", revision: 2 });
  assert.equal(
    modelCatalogReducer(state, {
      type: "loaded",
      revision: 1,
      models: ["old-key-catalog"],
    }),
    state,
  );
  assert.equal(
    modelCatalogReducer(state, { type: "reset", revision: 1 }),
    state,
  );
  state = modelCatalogReducer(state, { type: "load", revision: 2 });
  state = modelCatalogReducer(state, {
    type: "loaded",
    revision: 2,
    models: ["saved-model", "newly-discovered"],
  });
  assert.deepEqual(state, {
    kind: "ready",
    revision: 2,
    models: ["saved-model", "newly-discovered"],
  });
});
test("a first or middle conversion failure cleans every app-owned selected input", async () => {
  for (const failure of [0, 1]) {
    const cleaned: number[] = [];
    const converted: number[] = [];
    await assert.rejects(
      processAttachmentBatch([0, 1, 2], {
        sourceSize: () => 8,
        maxSourceFileBytes: 20,
        maxSourceTotalBytes: 30,
        convert: async (asset) => {
          converted.push(asset);
          if (asset === failure) throw Error("Decoder failed");
          return { ...photo, id: `photo-${asset}` };
        },
        cleanup: (asset) => {
          cleaned.push(asset);
        },
      }),
      /Decoder/,
    );
    assert.deepEqual(cleaned.sort(), [0, 1, 2]);
    assert.equal(converted.length, failure + 1);
  }
});
test("excess selection is rejected before size reads or conversions and all cache copies are cleaned", async () => {
  let reads = 0,
    converts = 0;
  const cleaned: number[] = [];
  await assert.rejects(
    processAttachmentBatch([0, 1, 2, 3, 4], {
      sourceSize: () => {
        reads++;
        return 8;
      },
      maxSourceFileBytes: 20,
      maxSourceTotalBytes: 100,
      convert: async () => {
        converts++;
        return photo;
      },
      cleanup: (a) => {
        cleaned.push(a);
      },
    }),
    /four files/,
  );
  assert.equal(reads, 0);
  assert.equal(converts, 0);
  assert.equal(cleaned.length, 5);
});
test("cumulative source size is rejected before file content reads", async () => {
  let converts = 0;
  let cleaned = 0;
  await assert.rejects(
    processAttachmentBatch([0, 1, 2], {
      sourceSize: () => 2 * 1024 * 1024,
      maxSourceFileBytes: 2 * 1024 * 1024,
      maxSourceTotalBytes: 4 * 1024 * 1024,
      convert: async () => {
        converts++;
        return photo;
      },
      cleanup: () => {
        cleaned++;
      },
    }),
    /combined selection/,
  );
  assert.equal(converts, 0);
  assert.equal(cleaned, 3);
});
test("backup export/import size policy agrees with actual UTF-8 bytes for ASCII, CJK, emoji and lone surrogates", () => {
  for (const text of [
    "plain text",
    "漢字".repeat(3000),
    "🙂".repeat(3000),
    "\ud800",
  ]) {
    const content = JSON.stringify({ text });
    assert.equal(utf8Size(content), Buffer.byteLength(content));
    assert.equal(JSON.parse(content).text, text);
    assert.doesNotThrow(() => assertBackupSize(utf8Size(content)));
  }
  assert.doesNotThrow(() => assertBackupSize(BACKUP_LIMIT));
  assert.throws(() => assertBackupSize(BACKUP_LIMIT + 1), /100 MB/);
  // This non-ASCII string is safe as characters but unsafe as bytes at the boundary.
  const cjk = "漢字";
  assert.doesNotThrow(() => assertBackupSize(BACKUP_LIMIT - 3 + cjk.length));
  assert.throws(
    () => assertBackupSize(BACKUP_LIMIT - 3 + utf8Size(cjk)),
    /100 MB/,
  );
});

test("native metadata omits unchanged file payloads while self-contained state round-trips", async () => {
  const { splitAttachmentStorage, hydrateAttachmentStorage } =
    await import("../src/attachment-storage");
  const data = fixture();
  const { metadata, blobs } = splitAttachmentStorage(data);
  const saved = JSON.parse(metadata);
  assert.equal(saved.conversations[0].draftAttachments[0].data, undefined);
  assert.equal(saved.conversations[0].draftAttachments[0].blobId, photo.id);
  assert.equal(blobs.get(photo.id), photo.data);
  const { parseData } = await import("../src/domain");
  const restored = parseData(hydrateAttachmentStorage(saved, blobs), true);
  assert.deepEqual(restored.conversations[0].draftAttachments, [photo]);
  assert.deepEqual(parseData(data).conversations[0].draftAttachments, [photo]);
  assert.throws(() => parseData(saved), /attachment/i);
});
test("legacy inline attachments migrate without loss; missing blob data fails closed", async () => {
  const { splitAttachmentStorage, hydrateAttachmentStorage } =
    await import("../src/attachment-storage");
  const data = fixture();
  assert.deepEqual(hydrateAttachmentStorage(data, new Map()), data);
  const { metadata } = splitAttachmentStorage(data);
  assert.throws(
    () => hydrateAttachmentStorage(JSON.parse(metadata), new Map()),
    /could not be opened/,
  );
});
test("attachment identity conflict is rejected before persistence and deleted attachments leave no referenced blobs", async () => {
  const { splitAttachmentStorage } = await import("../src/attachment-storage");
  const data = fixture();
  data.conversations.push({
    ...createConversation("provider"),
    draftAttachments: [{ ...photo, data: "different" }],
  });
  const before = JSON.stringify(data);
  assert.throws(() => splitAttachmentStorage(data), /identity/);
  assert.equal(JSON.stringify(data), before);
  data.conversations = [
    {
      ...createConversation("provider"),
      draft: "Kept text",
      draftAttachments: [],
    },
  ];
  assert.equal(splitAttachmentStorage(data).blobs.size, 0);
});
test("representative 2 MB image payload does not bloat each streaming metadata checkpoint", async () => {
  const { splitAttachmentStorage } = await import("../src/attachment-storage");
  const data = fixture();
  const binary = Buffer.alloc(2 * 1024 * 1024);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(binary);
  data.conversations[0].draftAttachments = [
    { ...photo, size: binary.length, data: binary.toString("base64") },
  ];
  const first = splitAttachmentStorage(data);
  assert.ok(first.metadata.length < 2000);
  data.conversations[0].draft = "Newly typed text";
  const next = splitAttachmentStorage(data);
  assert.equal(next.blobs.get(photo.id), first.blobs.get(photo.id));
  assert.ok(next.metadata.length < 2000);
});
