import { File } from "expo-file-system";
import * as Print from "expo-print";
import { Attachment } from "./types";
import { uid } from "./domain";
import {
  DocumentInput,
  documentHtml,
  documentName,
  textDocument,
  validateDocumentInput,
} from "./document-content";
export const supportedDocumentFormats = ["pdf", "txt"] as const;
export async function createDocumentFile(
  input: DocumentInput,
): Promise<Attachment> {
  validateDocumentInput(input);
  if (input.format === "txt") return textDocument(input);
  const output = await Print.printToFileAsync({
    html: documentHtml(input.title, input.content),
    width: 595,
    height: 842,
  });
  const file = new File(output.uri);
  try {
    const data = await file.base64();
    return {
      id: uid(),
      name: documentName(input.title, "pdf"),
      mimeType: "application/pdf",
      data,
      size: file.size,
    };
  } finally {
    if (file.exists) file.delete();
  }
}
