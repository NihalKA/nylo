import { Attachment } from "./types";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_BYTES,
  MAX_MESSAGE_BYTES,
  validateAttachments,
} from "./attachments";
// Batch state machine: validate selection → process within budget → validate result → cleanup all inputs.
// Cleanup also runs on cancellation-by-error before the first or any later conversion.
export async function processAttachmentBatch<T>(
  assets: T[],
  options: {
    sourceSize: (asset: T) => number;
    maxSourceFileBytes: number;
    maxSourceTotalBytes: number;
    convert: (asset: T) => Promise<Attachment>;
    cleanup: (asset: T) => void | Promise<void>;
  },
) {
  try {
    if (assets.length > MAX_ATTACHMENTS)
      throw new Error("Choose up to four files at a time.");
    let sourceBytes = 0;
    for (const asset of assets) {
      const bytes = options.sourceSize(asset);
      if (
        !Number.isFinite(bytes) ||
        bytes <= 0 ||
        bytes > options.maxSourceFileBytes
      )
        throw new Error(
          "One of the selected files is too large or unavailable.",
        );
      sourceBytes += bytes;
      if (sourceBytes > options.maxSourceTotalBytes)
        throw new Error(
          "The combined selection is too large. Choose fewer files.",
        );
    }
    const output: Attachment[] = [];
    let total = 0;
    for (const asset of assets) {
      const attachment = await options.convert(asset);
      total += attachment.size;
      if (attachment.size > MAX_ATTACHMENT_BYTES || total > MAX_MESSAGE_BYTES)
        throw new Error(
          "Keep each attachment under 2 MB and the combined message under 4 MB.",
        );
      output.push(attachment);
      validateAttachments(output);
    }
    return output;
  } finally {
    await Promise.allSettled(
      assets.map((asset) =>
        Promise.resolve().then(() => options.cleanup(asset)),
      ),
    );
  }
}
