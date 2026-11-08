import { Connection } from "./types";
// A durable retirement entry must exist before SecureStore can receive a new
// secret. Activation removes that entry in the same write as connection metadata.
export async function stageCredential(steps: {
  journal: () => Promise<void>;
  write: () => Promise<void>;
  activate: () => Promise<void>;
  rollback: () => Promise<void>;
}) {
  await steps.journal();
  try {
    await steps.write();
    await steps.activate();
  } catch (error) {
    await steps.rollback().catch(() => {});
    throw error;
  }
}
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
