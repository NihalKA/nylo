import { Connection } from "./types";
export function credentialDestination(
  connection: Pick<Connection, "protocol" | "baseUrl">,
) {
  return `${connection.protocol}:${new URL(connection.baseUrl).toString().replace(/\/+$/, "")}`;
}
export function encodeCredential(key: string, destination: string) {
  return JSON.stringify({ version: 1, destination, key });
}
export function decodeCredential(
  raw: string | null,
  expectedDestination: string,
): string | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    return value?.version === 1 &&
      value.destination === expectedDestination &&
      typeof value.key === "string" &&
      value.key.length
      ? value.key
      : null;
  } catch {
    return null;
  } // Old unbound keys require explicit re-entry.
}
