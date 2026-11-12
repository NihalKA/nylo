import { DocumentInput, textDocument } from "./document-content";
export const supportedDocumentFormats = ["txt"] as const;
export async function createDocumentFile(input: DocumentInput) {
  if (input.format !== "txt")
    throw new Error("PDF file creation is available in the mobile app.");
  return textDocument(input);
}
