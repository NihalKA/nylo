import { utf8Size } from "./byte-size";
import { Attachment } from "./types";
import { uid } from "./domain";
export type DocumentFormat = "pdf" | "txt";
export type DocumentInput = {
  title: string;
  content: string;
  format: DocumentFormat;
};
export function validateDocumentInput(value: DocumentInput) {
  if (
    !value ||
    typeof value.title !== "string" ||
    !value.title.trim() ||
    value.title.length > 100 ||
    typeof value.content !== "string" ||
    !value.content.trim() ||
    value.content.length > 50000 ||
    !["pdf", "txt"].includes(value.format)
  )
    throw new Error(
      "Choose a title up to 100 characters and document content up to 50,000 characters.",
    );
}
export function documentName(title: string, format: DocumentFormat) {
  return `${
    title
      .trim()
      .replace(/[\\/\u0000-\u001f<>:"|?*]/g, "-")
      .replace(/\.(pdf|txt)$/i, "")
      .slice(0, 100) || "Nylo document"
  }.${format}`;
}
export function textDocument(input: DocumentInput): Attachment {
  validateDocumentInput(input);
  return {
    id: uid(),
    name: documentName(input.title, "txt"),
    mimeType: "text/plain",
    data: input.content,
    size: utf8Size(input.content),
  };
}
const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const inline = (value: string) =>
  escape(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((x) => x.trim());
export function documentHtml(title: string, content: string) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length)
      blocks.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
    paragraph = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.trimStart().startsWith("```")) {
      flush();
      const code: string[] = [];
      while (++i < lines.length && !lines[i].trimStart().startsWith("```"))
        code.push(lines[i]);
      blocks.push(`<pre>${escape(code.join("\n"))}</pre>`);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length + 1;
      blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const header = cells(line),
      divider = cells(lines[i + 1] || "");
    if (
      header.length >= 2 &&
      header.length <= 10 &&
      header.length === divider.length &&
      divider.every((x) => /^:?-{3,}:?$/.test(x))
    ) {
      flush();
      i++;
      const rows: string[][] = [];
      while (
        i + 1 < lines.length &&
        lines[i + 1].includes("|") &&
        lines[i + 1].trim()
      )
        rows.push(cells(lines[++i]));
      blocks.push(
        `<table><thead><tr>${header.map((x) => `<th>${inline(x)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, n) => `<td>${inline(row[n] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
      );
      continue;
    }
    const bullet = /^(?:[-*]|\d+[.)])\s+(.+)$/.exec(line);
    if (bullet) {
      flush();
      blocks.push(`<p class="bullet">&#8226; ${inline(bullet[1])}</p>`);
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>@page{size:A4;margin:36pt}body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.5;color:#182033;margin:0}h1{font-size:23pt;line-height:1.2;color:#243d8f;margin:0 0 22pt}h2,h3,h4{line-height:1.25;margin:18pt 0 8pt;break-after:avoid}h2{font-size:17pt}h3{font-size:14pt}h4{font-size:12pt}p{margin:0 0 10pt;overflow-wrap:anywhere}.bullet{padding-left:12pt;text-indent:-10pt}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:12pt 0 18pt}thead{display:table-header-group}th,td{border:1px solid #ccd3e0;padding:7pt;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf1fc}tr{break-inside:avoid}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f8;padding:10pt;font-size:9pt}code{font-family:monospace}</style></head><body><h1>${escape(title)}</h1>${blocks.join("\n")}</body></html>`;
}
