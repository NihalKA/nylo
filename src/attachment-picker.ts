import { Attachment } from "./types";
export type AttachmentSource = "files" | "photos" | "camera";
export async function pickAttachments(
  _source: AttachmentSource,
  _onPreparing?: () => void,
): Promise<Attachment[]> {
  throw new Error(
    "Use the iPhone app to attach files, photos or a camera image.",
  );
}
