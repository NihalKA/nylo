import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import { AppData, emptyData } from "./types";
import { parseData } from "./domain";

const db = SQLite.openDatabaseAsync("nylo.db").then(async (database) => {
  await database.execAsync(
    "PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL);",
  );
  return database;
});
export async function readData(): Promise<AppData> {
  const row = await (
    await db
  ).getFirstAsync<{ json: string }>("SELECT json FROM app_state WHERE id = 1");
  return row ? parseData(JSON.parse(row.json)) : emptyData();
}
export async function writeData(data: AppData) {
  await (
    await db
  ).runAsync(
    "INSERT INTO app_state(id, json) VALUES(1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json",
    JSON.stringify(data),
  );
}
const keyName = (id: string) => `nylo.provider.${id}`;
export const readKey = (id: string) => SecureStore.getItemAsync(keyName(id));
export const writeKey = (id: string, key: string) =>
  SecureStore.setItemAsync(keyName(id), key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
export const removeKey = (id: string) =>
  SecureStore.deleteItemAsync(keyName(id));
