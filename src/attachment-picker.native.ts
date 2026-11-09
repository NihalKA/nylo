import {
  assertAttachmentActive,
  attachmentStep,
  prepareAttachments,
} from "./attachment-operation";
import { utf8Size } from "./byte-size";
import { processAttachmentBatch } from "./attachment-batch";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import { Attachment } from "./types";
import { uid } from "./domain";
import { MAX_ATTACHMENT_BYTES } from "./attachments";
export type AttachmentPreparation =
  "inspecting" | "opening" | "decoding" | "encoding" | "reading";
export type AttachmentSource = "files" | "photos" | "camera";
export async function pickAttachments(
  source: AttachmentSource,
  onPreparing?: (stage: AttachmentPreparation) => void,
): Promise<Attachment[]> {
  if (source === "files") {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "image/jpeg",
        "image/png",
      ],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return [];
    onPreparing?.("inspecting");
    return prepareAttachments((signal) =>
      processAttachmentBatch(result.assets, {
        sourceSize: (asset) => {
          assertAttachmentActive(signal);
          return new File(asset.uri).size;
        },
        maxSourceFileBytes: MAX_ATTACHMENT_BYTES,
        maxSourceTotalBytes: 4 * 1024 * 1024,
        convert: async (asset) => {
          assertAttachmentActive(signal);
          const file = new File(asset.uri);
          if (asset.mimeType?.startsWith("image/"))
            return image(asset.uri, signal, onPreparing);
          if (
            asset.mimeType === "application/pdf" ||
            /\.pdf$/i.test(asset.name)
          )
            return {
              id: uid(),
              name: asset.name.slice(0, 200),
              mimeType: "application/pdf",
              size: file.size,
              data: await attachmentStep(file.base64(), signal),
            };
          if (
            /\.(txt|md|csv|json|log)$/i.test(asset.name) ||
            asset.mimeType?.startsWith("text/")
          ) {
            const data = await attachmentStep(file.text(), signal);
            return {
              id: uid(),
              name: asset.name.slice(0, 200),
              mimeType: "text/plain",
              size: utf8Size(data),
              data,
            };
          }
          throw new Error("Choose a PDF, text file, JPEG or PNG photo.");
        },
        cleanup: (asset) => {
          if (asset.uri.startsWith(Paths.cache.uri)) {
            const file = new File(asset.uri);
            if (file.exists) file.delete();
          }
        },
      }),
    );
  }
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "Camera access is off. You can enable it in device settings or choose an existing photo.",
      );
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          exif: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          selectionLimit: 4,
          // Nylo re-encodes after enforcing source-size bounds. Avoid the
          // picker's redundant data export/conversion before returning a file.
          quality: 1,
          preferredAssetRepresentationMode:
            ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
          exif: false,
        });
  if (result.canceled) return [];
  onPreparing?.("inspecting");
  return prepareAttachments((signal) =>
    processAttachmentBatch(result.assets, {
      sourceSize: (asset) => {
        assertAttachmentActive(signal);
        return asset.fileSize || new File(asset.uri).size;
      },
      maxSourceFileBytes: 20 * 1024 * 1024,
      maxSourceTotalBytes: 80 * 1024 * 1024,
      convert: (asset) => image(asset.uri, signal, onPreparing),
      cleanup: (asset) => {
        if (asset.uri.startsWith(Paths.cache.uri)) {
          const file = new File(asset.uri);
          if (file.exists) file.delete();
        }
      },
    }),
  );
}
async function image(
  uri: string,
  signal: AbortSignal,
  onPreparing?: (stage: AttachmentPreparation) => void,
): Promise<Attachment> {
  // Decode within bounds rather than loading a full camera image and upscaling
  // small images. Re-encoding pixels excludes the original EXIF metadata.
  assertAttachmentActive(signal);
  onPreparing?.("opening");
  const context = ImageManipulator.manipulate(uri, {
    maxWidth: 1600,
    maxHeight: 1600,
  });
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let file: File | undefined;
  try {
    onPreparing?.("decoding");
    rendered = await attachmentStep(context.renderAsync(), signal, (late) =>
      late.release(),
    );
    onPreparing?.("encoding");
    const result = await attachmentStep(
      rendered.saveAsync({
        compress: 0.75,
        format: SaveFormat.JPEG,
        base64: true,
      }),
      signal,
      (late) => {
        const lateFile = new File(late.uri);
        if (lateFile.exists) lateFile.delete();
      },
    );
    file = new File(result.uri);
    onPreparing?.("reading");
    assertAttachmentActive(signal);
    if (!result.base64) throw new Error("This photo could not be prepared.");
    const bytes =
      (result.base64.length * 3) / 4 -
      (result.base64.endsWith("==") ? 2 : result.base64.endsWith("=") ? 1 : 0);
    if (bytes > MAX_ATTACHMENT_BYTES)
      throw new Error("This photo is still too large. Choose a smaller image.");
    return {
      id: uid(),
      name: "Photo.jpg",
      mimeType: "image/jpeg",
      size: bytes,
      data: result.base64,
    };
  } finally {
    rendered?.release();
    context.release();
    try {
      if (file?.exists) file.delete();
    } catch {}
  }
}
