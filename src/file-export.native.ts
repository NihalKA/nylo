import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Attachment } from "./types";
export async function shareGeneratedFile(attachment: Attachment) {
  const file = new File(Paths.cache, `nylo-${attachment.id}.png`);
  file.write(attachment.data, { encoding: "base64" });
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: attachment.mimeType,
      dialogTitle: "Save or share your image",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
async function prepareResponseFile(text: string, format: "txt" | "pdf") {
  let file: File;
  if (format === "pdf") {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const result = await Print.printToFileAsync({
      html: `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:28px;color:#182033}pre{font-family:inherit;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.55}</style></head><body><pre>${escaped}</pre></body></html>`,
    });
    file = new File(result.uri);
  } else {
    file = new File(Paths.cache, `Nylo-response-${Date.now()}.txt`);
    file.write(text);
  }
  return file;
}
export async function checkLocalExports() {
  for (const format of ["txt", "pdf"] as const) {
    const file = await prepareResponseFile(
      "Synthetic offline export: 7 x 12 = 84.",
      format,
    );
    try {
      if (
        format === "txt" &&
        (await file.text()) !== "Synthetic offline export: 7 x 12 = 84."
      )
        throw new Error("Text export check failed.");
      if (
        format === "pdf" &&
        String.fromCharCode(...file.bytesSync().slice(0, 5)) !== "%PDF-"
      )
        throw new Error("PDF export check failed.");
    } finally {
      if (file.exists) file.delete();
    }
  }
}
export async function exportResponse(text: string, format: "txt" | "pdf") {
  const file = await prepareResponseFile(text, format);
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: format === "pdf" ? "application/pdf" : "text/plain",
      dialogTitle: "Save your Nylo response",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
