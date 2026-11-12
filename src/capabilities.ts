import { Connection } from "./types";

// Known API integration, not a promise of account entitlement. No network probing.
export function connectionCapabilities(connection: Connection) {
  const nylo =
    connection.baseUrl.replace(/\/+$/, "") === "https://codex.nylohq.com/v1";
  return {
    imageModel: connection.imageModel ?? (nylo ? "gpt-image-2" : ""),
    webSearch:
      connection.protocol === "openai" && (connection.webSearch ?? nylo),
    images:
      connection.protocol !== "anthropic" &&
      !!(connection.imageModel ?? (nylo ? "gpt-image-2" : "")),
  };
}
