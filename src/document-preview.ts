import { Attachment } from "./types";
export async function openPdfPreview(_attachment: Attachment): Promise<void> {
  throw new Error("Use the local document preview.");
}

export async function preparePdfPreview(
  _attachment: Attachment,
): Promise<{ uri: string; cleanup: () => void }> {
  throw new Error("Use the local document preview.");
}
