import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

function fixture(foreign = false) {
  const root = mkdtempSync(join(tmpdir(), "nylo-sdk-export-"));
  const pdf = Buffer.from("%PDF-1.7\nSynthetic fixture");
  const text = "Synthetic offline sample. Test text.";
  const state = {
    connections: [
      {
        id: "offline",
        baseUrl: foreign
          ? "https://real.invalid/v1"
          : "https://example.invalid/v1",
        model: "synthetic-no-network",
      },
    ],
    conversations: [
      {
        title: "Example: SDK image",
        connectionId: "offline",
        messages: [
          {
            text: "Synthetic offline SDK example.",
            generatedFiles: [
              {
                id: "image",
                name: "tile.png",
                mimeType: "image/png",
                blobId: "image",
                size: 1,
              },
              {
                id: "pdf",
                name: "Offline SDK report.pdf",
                mimeType: "application/pdf",
                blobId: "pdf",
                size: pdf.length,
              },
              {
                id: "txt",
                name: "Offline SDK text.txt",
                mimeType: "text/plain",
                blobId: "txt",
                size: Buffer.byteLength(text),
              },
            ],
          },
        ],
      },
    ],
  };
  const database = join(root, "nylo.db");
  execFileSync(
    "python3",
    [
      "-c",
      'import json,sqlite3,sys; a=json.load(sys.stdin); db=sqlite3.connect(sys.argv[1]); db.executescript("CREATE TABLE app_state(id INTEGER,json TEXT); CREATE TABLE attachment_blobs(id TEXT,data TEXT);"); db.execute("INSERT INTO app_state VALUES(1,?)",(json.dumps(a["state"]),)); db.executemany("INSERT INTO attachment_blobs VALUES(?,?)",a["blobs"]); db.commit(); db.close()',
      database,
    ],
    {
      input: JSON.stringify({
        state,
        blobs: [
          ["pdf", pdf.toString("base64")],
          ["txt", text],
        ],
      }),
    },
  );
  return { root, database, pdf, text };
}

test("SDK artifact exporter writes only its synthetic PDF/text, never raw SQLite", () => {
  const f = fixture();
  const output = join(f.root, "output");
  execFileSync("python3", [
    "scripts/export-sdk-documents.py",
    f.database,
    output,
  ]);
  assert.deepEqual(readdirSync(output).sort(), [
    "sdk-notes.txt",
    "sdk-report.pdf",
  ]);
  assert.deepEqual(readFileSync(join(output, "sdk-report.pdf")), f.pdf);
  assert.equal(readFileSync(join(output, "sdk-notes.txt"), "utf8"), f.text);
});

test("SDK artifact exporter refuses a real-provider database before producing files", () => {
  const f = fixture(true);
  const output = join(f.root, "output");
  assert.throws(() =>
    execFileSync(
      "python3",
      ["scripts/export-sdk-documents.py", f.database, output],
      { stdio: "pipe" },
    ),
  );
  assert.equal(existsSync(output), false);
});
