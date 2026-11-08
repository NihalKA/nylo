import { AppData, Attachment } from "./types";
// Public state/backups retain self-contained attachments. Only native SQLite metadata uses blob refs.
export function splitAttachmentStorage(data: AppData) {
  const blobs = new Map<string, string>();
  const encode = (attachments?: Attachment[]) =>
    attachments?.map((a) => {
      if (blobs.has(a.id) && blobs.get(a.id) !== a.data)
        throw new Error("Conflicting saved attachment identity.");
      blobs.set(a.id, a.data);
      return {
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        size: a.size,
        blobId: a.id,
      };
    });
  const metadata = JSON.stringify({
    ...data,
    conversations: data.conversations.map((c) => ({
      ...c,
      draftAttachments: encode(c.draftAttachments),
      messages: c.messages.map((m) => ({
        ...m,
        attachments: encode(m.attachments),
      })),
    })),
  });
  return { metadata, blobs };
}
export function hydrateAttachmentStorage(
  value: unknown,
  blobs: Map<string, string>,
): unknown {
  if (!value || typeof value !== "object") return value;
  const data = value as AppData;
  if (!Array.isArray(data.conversations)) return value;
  const decode = (attachments: unknown) => {
    if (attachments === undefined) return undefined;
    if (!Array.isArray(attachments))
      throw new Error("Invalid saved attachments.");
    return attachments.map((a) => {
      if (a && typeof a.data === "string") return a; // Existing inline databases migrate on the next durable write.
      if (
        !a ||
        typeof a.blobId !== "string" ||
        a.blobId !== a.id ||
        !blobs.has(a.blobId)
      )
        throw new Error(
          "A saved attachment could not be opened. Existing data has not been replaced.",
        );
      const { blobId, ...metadata } = a;
      return { ...metadata, data: blobs.get(blobId) };
    });
  };
  return {
    ...data,
    conversations: data.conversations.map((c) => ({
      ...c,
      draftAttachments: decode(c?.draftAttachments),
      messages: Array.isArray(c?.messages)
        ? c.messages.map((m) => ({ ...m, attachments: decode(m?.attachments) }))
        : c?.messages,
    })),
  };
}
