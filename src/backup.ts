import { assertBackupSize, utf8Size } from "./byte-size";
import { parseData } from "./domain";
import { AppData } from "./types";
export async function exportBackup(data: AppData) {
  const content = JSON.stringify(parseData(data), null, 2);
  assertBackupSize(utf8Size(content));
  const url = URL.createObjectURL(
    new Blob([content], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `nylo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackup(): Promise<unknown | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        assertBackupSize(file.size);
        resolve(JSON.parse(await file.text()));
      } catch (error) {
        reject(error);
      }
    };
    input.click();
  });
}
