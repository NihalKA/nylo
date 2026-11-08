// Browser preview. Native builds resolve storage.native.ts instead.
import { AppData, emptyData } from "./types";
import { parseData } from "./domain";
const keys = new Map<string, string>();
export async function readData(): Promise<AppData> {
  const raw = localStorage.getItem("nylo.mobile.v1");
  return raw ? parseData(JSON.parse(raw)) : emptyData();
}
export async function writeData(data: AppData) {
  localStorage.setItem("nylo.mobile.v1", JSON.stringify(data));
}
export async function readKey(id: string) {
  return keys.get(id) ?? null;
}
export async function writeKey(id: string, key: string) {
  keys.set(id, key);
}
export async function removeKey(id: string) {
  keys.delete(id);
}
