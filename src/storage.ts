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
export async function readPreference(key: string): Promise<string | null> {
  return localStorage.getItem(`nylo.pref.${key}`);
}
export async function writePreference(key: string, value: string) {
  localStorage.setItem(`nylo.pref.${key}`, value);
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
