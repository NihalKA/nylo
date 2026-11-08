import { Attachment } from "./types";
export type AttachmentPreparation =
  "inspecting" | "opening" | "decoding" | "encoding" | "reading";
export type AttachmentSource = "files" | "photos" | "camera";
export async function pickAttachments(
  _source: AttachmentSource,
  _onPreparing?: (stage: AttachmentPreparation) => void,
): Promise<Attachment[]> {
  throw new Error(
    "Use the iPhone app to attach files, photos or a camera image.",
  );
}
