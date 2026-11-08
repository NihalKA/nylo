import { parseData } from "./domain";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { AppData } from "./types";
export async function exportBackup(data: AppData) {
  const file = new File(
    Paths.cache,
    `nylo-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
  const content = JSON.stringify(parseData(data), null, 2);
  if (content.length > 100 * 1024 * 1024)
    throw new Error(
      "This backup exceeds 100 MB. Remove unneeded attachment conversations before exporting.",
    );
  file.write(content);
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Save your Nylo backup",
      UTI: "public.json",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function pickBackup(): Promise<unknown | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    if (file.size > 100 * 1024 * 1024)
      throw new Error("Choose a backup smaller than 100 MB.");
    return JSON.parse(await file.text());
  } finally {
    if (file.uri.startsWith(Paths.cache.uri) && file.exists) file.delete();
  }
}
