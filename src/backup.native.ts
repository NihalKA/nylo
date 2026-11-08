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
  file.write(JSON.stringify(parseData(data), null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Save your Nylo backup",
    UTI: "public.json",
  });
}
export async function pickBackup(): Promise<unknown | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a backup smaller than 20 MB.");
  return JSON.parse(await file.text());
}
