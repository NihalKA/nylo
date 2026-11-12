import { createOpenAI } from "@ai-sdk/openai";
import { File, Paths } from "expo-file-system";
import { Connection } from "./types";
import { uid } from "./domain";
import { imageEditBody } from "./image-edit-body";

// RN Blob cannot construct from typed arrays. Keep the SDK image interface and
// give Expo fetch actual File objects whose bytes its multipart encoder supports.
export function sdkImageModel(
  model: ReturnType<ReturnType<typeof createOpenAI>["image"]>,
  connection: Connection,
  fetcher: typeof fetch,
): typeof model {
  return {
    specificationVersion: "v4",
    modelId: model.modelId,
    provider: model.provider,
    maxImagesPerCall: model.maxImagesPerCall,
    supportsFileInputs: true,
    supportsMaskInputs: false,
    async doGenerate(options) {
      if (!options.files?.length) return model.doGenerate(options);
      if (options.mask)
        throw new Error("Masked edits are not supported in Nylo.");
      const files: File[] = [];
      try {
        for (const input of options.files) {
          if (input.type !== "file")
            throw new Error("Only approved local image data can be edited.");
          const file = new File(
            Paths.cache,
            `nylo-edit-${uid()}.${input.mediaType === "image/jpeg" ? "jpg" : "png"}`,
          );
          files.push(file);
          if (typeof input.data === "string")
            await file.write(input.data, { encoding: "base64" });
          else await file.write(input.data);
        }
        const body = imageEditBody({
          model: model.modelId,
          prompt: options.prompt || "",
          size: options.size || "1024x1024",
          files,
        });
        const response = await fetcher(
          connection.baseUrl.replace(/\/+$/, "") + "/images/edits",
          {
            method: "POST",
            headers: Object.fromEntries(
              Object.entries(options.headers || {}).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
            body,
            signal: options.abortSignal,
          },
        );
        const result = await response.json();
        if (
          !Array.isArray(result.data) ||
          !result.data.length ||
          result.data.some(
            (x: { b64_json?: unknown }) => typeof x.b64_json !== "string",
          )
        )
          throw new Error("No image data returned.");
        return {
          images: result.data.map((x: { b64_json: string }) => x.b64_json),
          warnings: [],
          response: {
            timestamp: new Date(),
            modelId: model.modelId,
            headers: Object.fromEntries(response.headers.entries()),
          },
        };
      } finally {
        for (const file of files) if (file.exists) file.delete();
      }
    },
  };
}
