import { Connection } from "./types";
import { validateConnection } from "./domain";
// Listing models authenticates with the provider; it does not prove that a
// particular model supports this client's text protocol or tool calling.
export async function listModels(
  connection: Connection,
  key: string,
  fetcher: typeof fetch,
): Promise<string[]> {
  const valid = validateConnection({
    ...connection,
    model: connection.model || "discovery",
  });
  if (!key.trim()) throw new Error("Enter your API key first.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(`${valid.baseUrl}/models`, {
      method: "GET",
      redirect: "error",
      signal: controller.signal,
      headers:
        valid.protocol === "anthropic"
          ? { "x-api-key": key, "anthropic-version": "2023-06-01" }
          : { Authorization: `Bearer ${key}` },
    });
    if (response.redirected)
      throw new Error("Use the provider’s direct HTTPS endpoint.");
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "This API key was rejected. Check it and try again."
          : "The model list is unavailable. You can enter a model ID manually.",
      );
    const raw = await response.text();
    if (raw.length > 1000000)
      throw new Error(
        "The model list is too large. Enter a model ID manually.",
      );
    const value: unknown = JSON.parse(raw);
    const data = (value as { data?: unknown })?.data;
    if (!Array.isArray(data))
      throw new Error(
        "This provider did not return a model list. Enter a model ID manually.",
      );
    const ids = [
      ...new Set(
        data.flatMap((item) =>
          typeof item?.id === "string" && item.id.length <= 200
            ? [item.id as string]
            : [],
        ),
      ),
    ].sort();
    if (!ids.length)
      throw new Error(
        "No models were returned. Check account access or enter a model ID manually.",
      );
    return ids.slice(0, 500);
  } catch (error) {
    if (
      error instanceof Error &&
      /API key was rejected|model list|models were returned|direct HTTPS/.test(
        error.message,
      )
    )
      throw error;
    throw new Error(
      "Could not load models. Check your connection or enter a model ID manually.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
