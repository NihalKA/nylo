import { Directory, File, Paths } from "expo-file-system";
import { uid } from "./domain";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Attachment } from "./types";
import { documentHtml } from "./document-content";
export async function shareGeneratedFile(attachment: Attachment) {
  const extension =
    attachment.mimeType === "application/pdf"
      ? "pdf"
      : attachment.mimeType === "text/plain"
        ? "txt"
        : attachment.mimeType === "image/jpeg"
          ? "jpg"
          : "png";
  const stem =
    attachment.name
      .replace(/\.[^.]*$/, "")
      .replace(/[\\/\u0000-\u001f]/g, "-")
      .slice(0, 100) || "Nylo file";
  const directory = new Directory(Paths.cache, `nylo-share-${uid()}`);
  try {
    await directory.create();
    const file = new File(directory, `${stem}.${extension}`);
    await file.write(
      attachment.data,
      attachment.mimeType === "text/plain" ? undefined : { encoding: "base64" },
    );
    await Sharing.shareAsync(file.uri, {
      mimeType: attachment.mimeType,
      dialogTitle: "Save or share your file",
    });
  } finally {
    if (directory.exists) directory.delete();
  }
}
async function prepareResponseFile(text: string, format: "txt" | "pdf") {
  let file: File;
  if (format === "pdf") {
    const result = await Print.printToFileAsync({
      html: documentHtml("Nylo response", text),
      width: 595,
      height: 842,
    });
    file = new File(result.uri);
  } else {
    file = new File(Paths.cache, `Nylo-response-${Date.now()}.txt`);
    await file.write(text);
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
