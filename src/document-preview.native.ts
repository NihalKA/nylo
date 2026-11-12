import { Directory, File, Paths } from "expo-file-system";
import { requireOptionalNativeModule } from "expo";
import { Attachment } from "./types";
import { uid } from "./domain";
export async function openPdfPreview(attachment: Attachment) {
  const native = requireOptionalNativeModule<{
    openPdf: (uri: string) => Promise<void>;
  }>("NyloDocumentPreview");
  if (!native)
    throw new Error(
      "PDF preview needs the updated app. Save or share is still available.",
    );
  if (attachment.mimeType !== "application/pdf")
    throw new Error("Choose a PDF document.");
  const copy = await preparePdfPreview(attachment);
  try {
    await native.openPdf(copy.uri);
  } catch (error) {
    copy.cleanup();
    throw error;
  }
}
export async function preparePdfPreview(attachment: Attachment) {
  if (attachment.mimeType !== "application/pdf")
    throw new Error("Choose a PDF document.");
  const directory = new Directory(Paths.cache, `nylo-preview-${uid()}`);
  try {
    await directory.create();
    const name =
      (attachment.name
        .replace(/\.[^.]*$/, "")
        .replace(/[\\/\u0000-\u001f]/g, "-")
        .slice(0, 100) || "Nylo document") + ".pdf";
    const file = new File(directory, name);
    await file.write(attachment.data, { encoding: "base64" });
    // The native viewer owns this temporary copy until it closes. The saved
    // attachment is never changed; do not remove a file still being displayed.
    return {
      uri: file.uri,
      cleanup: () => {
        if (directory.exists) directory.delete();
      },
    };
  } catch (error) {
    if (directory.exists) directory.delete();
    throw error;
  }
}
