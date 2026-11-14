import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import { mountStore } from "./helpers/store-harness";
import { interactiveFixture, phoneReply } from "./helpers/interactive-fixtures";

test("form submits once through the real store, keeps drafts/files and records accepted choices", async () => {
  const h = await mountStore(interactiveFixture());
  try {
    let run!: Promise<void>;
    const options = {
      interactive: {
        messageId: "a",
        values: { budget: 35000, priority: "Camera" },
      },
    };
    await act(async () => {
      run = h.store.send("c", "", false, undefined, options);
    });
    assert.equal(h.requests.length, 1);
    await assert.rejects(
      h.store.send("c", "", false, undefined, options),
      /already responding/,
    );
    assert.equal(h.saved().conversations[0].draft, "keep my draft");
    assert.equal(h.saved().conversations[0].draftAttachments!.length, 1);
    const user = h.requests[0].request.messages.at(-1)!;
    assert.match(user.text, /Budget: 35000\nPriority: Camera/);
    assert.equal(user.attachments?.length, 0);
    assert.equal(
      h.saved().conversations[0].messages[1].interactive!.submitted,
      user.text,
    );
    await act(async () => {
      h.requests[0].request.onText("Updated recommendations");
      h.requests[0].done.resolve();
      await run;
    });
    await act(async () => {
      await assert.rejects(
        h.store.send("c", "", false, undefined, options),
        /already been sent/,
      );
    });
    assert.equal(h.requests.length, 1);
  } finally {
    await h.close();
  }
});
test("saving a tool section is durable and interrupted replies keep controls unavailable", async () => {
  const h = await mountStore(interactiveFixture());
  try {
    let run!: Promise<void>;
    await act(async () => {
      run = h.store.send("c", "Show another comparison");
    });
    await act(async () => {
      await h.requests[0].request.onInteractive!(phoneReply());
    });
    assert.equal(
      h.saved().conversations[0].messages.at(-1)!.interactive!.version,
      1,
    );
    assert.match(h.saved().conversations[0].messages.at(-1)!.text, /Sample A/);
    await act(async () => {
      h.store.stop("c");
      await run;
    });
    const last = h.saved().conversations[0].messages.at(-1)!;
    assert.equal(last.status, "interrupted");
    await act(async () => {
      await assert.rejects(
        h.store.send("c", "", false, undefined, {
          interactive: { messageId: last.id, values: {} },
        }),
        /finish/,
      );
    });
    assert.equal(h.requests.length, 1);
  } finally {
    await h.close();
  }
});
test("failed acceptance leaves a form retryable and sends no request", async () => {
  let fail = true;
  const h = await mountStore(interactiveFixture(), {
    write: async () => {
      if (fail) throw new Error("Disk full");
    },
  });
  try {
    const options = {
      interactive: {
        messageId: "a",
        values: { budget: 35000, priority: "Camera" },
      },
    };
    await act(async () => {
      await assert.rejects(
        h.store.send("c", "", false, undefined, options),
        /save/,
      );
    });
    assert.equal(h.requests.length, 0);
    assert.equal(
      h.saved().conversations[0].messages[1].interactive!.submitted,
      undefined,
    );
    fail = false;
    let run!: Promise<void>;
    await act(async () => {
      run = h.store.send("c", "", false, undefined, options);
    });
    assert.equal(h.requests.length, 1);
    await act(async () => {
      h.requests[0].request.onText("Done");
      h.requests[0].done.resolve();
      await run;
    });
  } finally {
    await h.close();
  }
});
