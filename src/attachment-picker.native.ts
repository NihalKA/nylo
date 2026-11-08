import { utf8Size } from "./byte-size";
import { processAttachmentBatch } from "./attachment-batch";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import { Attachment } from "./types";
import { uid } from "./domain";
import { MAX_ATTACHMENT_BYTES } from "./attachments";
export type AttachmentSource = "files" | "photos" | "camera";
export async function pickAttachments(
  source: AttachmentSource,
  onPreparing?: () => void,
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
    onPreparing?.();
    return processAttachmentBatch(result.assets, {
      sourceSize: (asset) => new File(asset.uri).size,
      maxSourceFileBytes: MAX_ATTACHMENT_BYTES,
      maxSourceTotalBytes: 4 * 1024 * 1024,
      convert: async (asset) => {
        const file = new File(asset.uri);
        if (asset.mimeType?.startsWith("image/")) return image(asset.uri);
        if (asset.mimeType === "application/pdf" || /\.pdf$/i.test(asset.name))
          return {
            id: uid(),
            name: asset.name.slice(0, 200),
            mimeType: "application/pdf",
            size: file.size,
            data: await file.base64(),
          };
        if (
          /\.(txt|md|csv|json|log)$/i.test(asset.name) ||
          asset.mimeType?.startsWith("text/")
        ) {
          const data = await file.text();
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
    });
  }
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "Camera access is off. You can enable it in iPhone Settings or choose an existing photo.",
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
  onPreparing?.();
  return processAttachmentBatch(result.assets, {
    sourceSize: (asset) => asset.fileSize || new File(asset.uri).size,
    maxSourceFileBytes: 20 * 1024 * 1024,
    maxSourceTotalBytes: 80 * 1024 * 1024,
    convert: (asset) => image(asset.uri),
    cleanup: (asset) => {
      if (asset.uri.startsWith(Paths.cache.uri)) {
        const file = new File(asset.uri);
        if (file.exists) file.delete();
      }
    },
  });
}
async function image(uri: string): Promise<Attachment> {
  // Re-encode selected pixels so EXIF/location metadata never enters chat state.
  const result = await manipulateAsync(uri, [{ resize: { width: 1600 } }], {
    compress: 0.75,
    format: SaveFormat.JPEG,
  });
  const file = new File(result.uri);
  try {
    if (file.size > MAX_ATTACHMENT_BYTES)
      throw new Error("This photo is still too large. Choose a smaller image.");
    return {
      id: uid(),
      name: "Photo.jpg",
      mimeType: "image/jpeg",
      size: file.size,
      data: await file.base64(),
    };
  } finally {
    try {
      file.delete();
    } catch {}
  }
}
