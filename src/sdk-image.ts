import { createOpenAI } from "@ai-sdk/openai";
import { Connection } from "./types";
export function sdkImageModel(
  model: ReturnType<ReturnType<typeof createOpenAI>["image"]>,
  _connection: Connection,
  _fetcher: typeof fetch,
) {
  return model;
}
