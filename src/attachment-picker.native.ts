import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import { Attachment } from "./types";
import { uid } from "./domain";
import { MAX_ATTACHMENT_BYTES, validateAttachments } from "./attachments";
export type AttachmentSource = "files" | "photos" | "camera";
export async function pickAttachments(
  source: AttachmentSource,
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
    const output: Attachment[] = [];
    try {
      for (const asset of result.assets) {
        const file = new File(asset.uri);
        if (!file.size || file.size > MAX_ATTACHMENT_BYTES)
          throw new Error("Choose files up to 2 MB each.");
        if (asset.mimeType?.startsWith("image/")) {
          output.push(await image(asset.uri));
        } else if (
          asset.mimeType === "application/pdf" ||
          /\.pdf$/i.test(asset.name)
        ) {
          output.push({
            id: uid(),
            name: asset.name.slice(0, 200),
            mimeType: "application/pdf",
            size: file.size,
            data: await file.base64(),
          });
        } else if (
          /\.(txt|md|csv|json|log)$/i.test(asset.name) ||
          asset.mimeType?.startsWith("text/")
        ) {
          const data = await file.text();
          output.push({
            id: uid(),
            name: asset.name.slice(0, 200),
            mimeType: "text/plain",
            size: new TextEncoder().encode(data).length,
            data,
          });
        } else throw new Error("Choose a PDF, text file, JPEG or PNG photo.");
      }
      return validateAttachments(output);
    } finally {
      for (const asset of result.assets) {
        try {
          if (asset.uri.startsWith(Paths.cache.uri))
            new File(asset.uri).delete();
        } catch {}
      }
    }
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
          quality: 0.8,
          exif: false,
        });
  if (result.canceled) return [];
  const output: Attachment[] = [];
  for (const asset of result.assets) {
    try {
      output.push(await image(asset.uri));
    } finally {
      try {
        if (asset.uri.startsWith(Paths.cache.uri)) new File(asset.uri).delete();
      } catch {}
    }
  }
  return validateAttachments(output);
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
