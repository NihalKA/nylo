import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { installFormDataPatch } from "expo/src/winter/FormData";
import { normalizeBodyInitAsync } from "expo/src/winter/fetch/RequestUtils";
import { imageEditBody } from "../src/image-edit-body";
import { checkSDKMultipartUpload } from "../src/sdk-upload-check";

async function withExpoFormData<T>(run: () => Promise<T>): Promise<T> {
  const original = globalThis.FormData;
  class NativeFormData {
    _parts: [string, unknown][] = [];
  }
  globalThis.FormData = installFormDataPatch(
    NativeFormData as unknown as typeof FormData,
  ) as unknown as typeof FormData;
  try {
    return await run();
  } finally {
    globalThis.FormData = original;
  }
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);

test("Expo fetch rejects the old URI-only edit part before sending", async () => {
  await withExpoFormData(async () => {
    const form = new FormData();
    form.append("image", {
      uri: "file:///owned.png",
      name: "owned.png",
      type: "image/png",
    } as unknown as Blob);
    await assert.rejects(
      normalizeBodyInitAsync(form),
      /Unsupported FormDataPart implementation/,
    );
  });
});

test("edit uploads pass Expo's real encoder and arrive as image bytes at a local server", async () => {
  const encoded = await withExpoFormData(async () => {
    // Expo File implements bytes() without extending the global Blob class.
    const file = {
      name: "owned.png",
      type: "image/png",
      bytes: async () => new Uint8Array(png),
    };
    const body = imageEditBody({
      model: "synthetic-image",
      prompt: "edit the synthetic tile",
      size: "1024x1024",
      files: [file as unknown as Blob],
    });
    await checkSDKMultipartUpload(body, png.toString("base64"));
    return normalizeBodyInitAsync(body);
  });
  type ParsedMultipart = { get(name: string): unknown };
  let received: Promise<ParsedMultipart> | undefined;
  const server = createServer((req, res) => {
    const parsed = (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      return new Request("http://localhost/images/edits", {
        method: "POST",
        headers: { "content-type": String(req.headers["content-type"]) },
        body: Buffer.concat(chunks),
      }).formData() as unknown as Promise<ParsedMultipart>;
    })();
    received = parsed;
    void parsed.then(
      () => {
        res.writeHead(200);
        res.end("ok");
      },
      () => {
        res.writeHead(400);
        res.end();
      },
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/images/edits`,
      {
        method: "POST",
        headers: encoded.overriddenHeaders as [string, string][],
        body: encoded.body ? Buffer.from(encoded.body) : null,
      },
    );
    assert.equal(response.status, 200);
    const form = await received!;
    assert.equal(form.get("model"), "synthetic-image");
    assert.equal(form.get("prompt"), "edit the synthetic tile");
    const image = form.get("image") as File;
    assert.equal(image.name, "owned.png");
    assert.equal(image.type, "image/png");
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
