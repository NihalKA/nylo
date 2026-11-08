import {
  splitAttachmentStorage,
  hydrateAttachmentStorage,
} from "./attachment-storage";
import { decodeCredential, encodeCredential } from "./credentials";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { AppData, emptyData } from "./types";
import { parseData } from "./domain";

const db = SQLite.openDatabaseAsync("nylo.db").then(async (database) => {
  await database.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS attachment_blobs (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);",
  );
  return database;
});
let savedBlobs = new Map<string, string>();
export async function readData(): Promise<AppData> {
  const database = await db;
  const row = await database.getFirstAsync<{ json: string }>(
    "SELECT json FROM app_state WHERE id = 1",
  );
  if (!row) {
    const existing = await database.getFirstAsync<{ count: number }>(
      "SELECT count(*) AS count FROM attachment_blobs",
    );
    if (existing?.count)
      throw new Error(
        "Saved attachment metadata is missing. Existing files have not been replaced.",
      );
    return emptyData();
  }
  const rows = await database.getAllAsync<{ id: string; data: string }>(
    "SELECT id, data FROM attachment_blobs",
  );
  const blobs = new Map(rows.map((row) => [row.id, row.data]));
  const data = parseData(
    hydrateAttachmentStorage(JSON.parse(row.json), blobs),
    true,
  );
  savedBlobs = blobs;
  return data;
}
export async function writeData(data: AppData) {
  const database = await db;
  const { metadata, blobs } = splitAttachmentStorage(data);
  await database.withTransactionAsync(async () => {
    for (const [id, payload] of blobs) {
      if (savedBlobs.get(id) !== payload)
        await database.runAsync(
          "INSERT INTO attachment_blobs(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
          id,
          payload,
        );
    }
    await database.runAsync(
      "INSERT INTO app_state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json",
      metadata,
    );
    await database.runAsync(
      "DELETE FROM attachment_blobs WHERE id NOT IN (SELECT value FROM json_each(?))",
      JSON.stringify([...blobs.keys()]),
    );
  });
  savedBlobs = blobs;
}
const keyName = (id: string) => `nylo.provider.${id}`;
export const readKey = async (id: string, destination: string) =>
  decodeCredential(await SecureStore.getItemAsync(keyName(id)), destination);
export const writeKey = (id: string, key: string, destination: string) =>
  SecureStore.setItemAsync(keyName(id), encodeCredential(key, destination), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
export const removeKey = (id: string) =>
  SecureStore.deleteItemAsync(keyName(id));
