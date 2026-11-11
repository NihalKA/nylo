import { utf8Size } from "./byte-size";
import { Attachment, Protocol } from "./types";
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
export const MAX_MESSAGE_BYTES = 4 * 1024 * 1024;
export const MAX_ATTACHMENTS = 4;
export function validateAttachments(
  value: unknown,
  generated = false,
): Attachment[] {
  const maxBytes = generated ? 8 * 1024 * 1024 : MAX_ATTACHMENT_BYTES;
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS)
    throw new Error("Attach up to four files at a time.");
  let total = 0;
  const ids = new Set<string>();
  return value.map((a) => {
    if (
      !a ||
      typeof a.id !== "string" ||
      !/^[a-z0-9-]{1,80}$/.test(a.id) ||
      ids.has(a.id) ||
      typeof a.name !== "string" ||
      !a.name.trim() ||
      a.name.length > 200 ||
      !["image/jpeg", "image/png", "application/pdf", "text/plain"].includes(
        a.mimeType,
      ) ||
      !Number.isInteger(a.size) ||
      a.size <= 0 ||
      a.size > maxBytes ||
      typeof a.data !== "string"
    )
      throw new Error(
        "Invalid attachment. Choose a PDF, text file or photo up to 2 MB.",
      );
    ids.add(a.id);
    if (a.mimeType === "text/plain") {
      if (
        a.data.length > 100000 ||
        utf8Size(a.data) !== a.size ||
        a.data.includes("\u0000")
      )
        throw new Error(
          "Text files must contain up to 100,000 characters of readable text.",
        );
    } else {
      if (
        a.data.length > Math.ceil(maxBytes / 3) * 4 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(a.data) ||
        a.data.length % 4 !== 0
      )
        throw new Error("Invalid file encoding.");
      const size =
        (a.data.length * 3) / 4 -
        (a.data.endsWith("==") ? 2 : a.data.endsWith("=") ? 1 : 0);
      if (size !== a.size) throw new Error("Invalid file size.");
      const signatures: Record<string, string> = {
        "application/pdf": "JVBERi0",
        "image/png": "iVBORw0KGgo",
        "image/jpeg": "/9j/",
      };
      if (!a.data.startsWith(signatures[a.mimeType]))
        throw new Error("File content does not match its type.");
    }
    total += a.size;
    if (total > (generated ? 16 * 1024 * 1024 : MAX_MESSAGE_BYTES))
      throw new Error("Keep the combined attachments under 4 MB.");
    return {
      id: a.id,
      name: a.name.replace(/[\r\n\u0000-\u001f]/g, " ").trim(),
      mimeType: a.mimeType,
      size: a.size,
      data: a.data,
    } as Attachment;
  });
}
export function assertAttachmentProtocol(
  attachments: Attachment[],
  protocol: Protocol,
) {
  if (
    protocol === "compatible" &&
    attachments.some((a) => a.mimeType === "application/pdf")
  )
    throw new Error(
      "PDFs need a Responses or Claude Messages connection. Use a text file or choose another provider.",
    );
}
export function attachmentText(text: string, attachments: Attachment[]) {
  return [
    text,
    ...attachments
      .filter((a) => a.mimeType === "text/plain")
      .map(
        (a) =>
          `Attached file: ${a.name}\n<file_content>\n${a.data}\n</file_content>`,
      ),
  ]
    .filter(Boolean)
    .join("\n\n");
}
export function attachmentUri(attachment: Attachment) {
  return `data:${attachment.mimeType};base64,${attachment.data}`;
}

export const validateGeneratedFiles = (value: unknown) => {
  const files = validateAttachments(value, true);
  if (files.some((f) => !f.mimeType.startsWith("image/")))
    throw new Error("Invalid generated image.");
  return files;
};
