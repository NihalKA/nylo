import test from "node:test";
import assert from "node:assert/strict";
import {
  documentHtml,
  documentName,
  textDocument,
  validateDocumentInput,
} from "../src/document-content";
import { validateGeneratedFiles } from "../src/attachments";
import { emptyData } from "../src/types";
import { parseData } from "../src/domain";
import {
  splitAttachmentStorage,
  hydrateAttachmentStorage,
} from "../src/attachment-storage";

test("PDF content supports headings and tables without executing embedded HTML", () => {
  const html = documentHtml(
    "Weather <script>alert(1)</script>",
    '## Overview\n\n**Sample only**\n\n| Day | High |\n| --- | --- |\n| Example | 25 C |\n\n<img src="https://outside.invalid/pixel" onerror="alert(1)">\n\n```\n<script>alert(2)</script>\n```',
  );
  assert.ok(html.includes("<h3>Overview</h3>"));
  assert.ok(html.includes("<strong>Sample only</strong>"));
  assert.ok(html.includes("<th>Day</th>"));
  assert.ok(html.includes("<td>25 C</td>"));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img "));
  assert.ok(html.includes("&lt;img"));
  assert.ok(!html.includes("<iframe") && !html.includes("<link "));
});

test("document input limits and names constrain generated output", () => {
  for (const value of [
    { title: "", content: "x", format: "pdf" },
    { title: "Report", content: "x".repeat(50001), format: "txt" },
    { title: "Report", content: "x", format: "html" },
  ])
    assert.throws(() =>
      validateDocumentInput(
        value as Parameters<typeof validateDocumentInput>[0],
      ),
    );
  const name = documentName("../../report.pdf", "pdf");
  assert.ok(!name.includes("/") && !name.includes("\\"));
  assert.ok(name.endsWith(".pdf"));
});

test("generated PDF and UTF-8 text survive blob persistence/backups", () => {
  const text = textDocument({
    title: "Notes",
    content: "Bengaluru: café, 25 °C.",
    format: "txt",
  });
  const pdfData = Buffer.from(
    "%PDF-1.7\nSynthetic test fixture\n%%EOF",
  ).toString("base64");
  const pdf = {
    id: "sample-pdf",
    name: "Report.pdf",
    mimeType: "application/pdf" as const,
    size: Buffer.from(pdfData, "base64").length,
    data: pdfData,
  };
  validateGeneratedFiles([pdf, text]);
  const data = emptyData();
  data.connections = [
    {
      id: "test",
      name: "Test",
      provider: "custom",
      protocol: "openai",
      baseUrl: "https://example.invalid/v1",
      model: "synthetic",
    },
  ];
  data.conversations = [
    {
      id: "chat",
      title: "Files",
      connectionId: "test",
      createdAt: 1,
      updatedAt: 1,
      messages: [
        {
          id: "result",
          role: "assistant",
          text: "Files ready",
          status: "complete",
          createdAt: 1,
          generatedFiles: [pdf, text],
        },
      ],
    },
  ];
  const split = splitAttachmentStorage(data);
  assert.ok(
    !split.metadata.includes(pdfData) && !split.metadata.includes(text.data),
  );
  const restored = parseData(
    hydrateAttachmentStorage(JSON.parse(split.metadata), split.blobs),
    true,
  );
  assert.deepEqual(restored.conversations[0].messages[0].generatedFiles, [
    pdf,
    text,
  ]);
  assert.deepEqual(
    parseData(JSON.parse(JSON.stringify(restored))).conversations[0].messages[0]
      .generatedFiles,
    [pdf, text],
  );
});
