// Browser preview. Native builds resolve storage.native.ts instead.
import { decodeCredential, encodeCredential } from "./credentials";
import { AppData, emptyData } from "./types";
import { parseData } from "./domain";
const keys = new Map<string, string>();
export async function readData(): Promise<AppData> {
  const raw = localStorage.getItem("nylo.mobile.v1");
  return raw ? parseData(JSON.parse(raw), true) : emptyData();
}
export async function writeData(data: AppData) {
  localStorage.setItem("nylo.mobile.v1", JSON.stringify(data));
}
export async function readKey(id: string, destination: string) {
  return decodeCredential(keys.get(id) ?? null, destination);
}
export async function writeKey(id: string, key: string, destination: string) {
  keys.set(id, encodeCredential(key, destination));
}
export async function removeKey(id: string) {
  keys.delete(id);
}
