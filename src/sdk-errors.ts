import { ResponseStage, stageLabels } from "./response-progress";
export class ProviderRequestError extends Error {}
const codes = new Set([
  "rate_limit_exceeded",
  "insufficient_quota",
  "invalid_api_key",
  "model_not_found",
  "unsupported_parameter",
  "invalid_request_error",
  "context_length_exceeded",
  "content_policy_violation",
  "server_error",
  "timeout",
]);
export function knownProviderCode(value: unknown): string | undefined {
  return typeof value === "string" && codes.has(value) ? value : undefined;
}
// Never copy arbitrary error messages, request bodies, URLs or headers into chat.
export function sdkFailure(error: unknown, stage: ResponseStage): Error {
  if (error instanceof ProviderRequestError) return error;
  const names: Record<string, string> = {
    AI_InvalidToolInputError: "INVALID_TOOL_INPUT",
    AI_NoSuchToolError: "UNKNOWN_TOOL",
    AI_TypeValidationError: "INVALID_PROVIDER_RESPONSE",
    AI_JSONParseError: "INVALID_PROVIDER_JSON",
    AI_APICallError: "PROVIDER_REQUEST_FAILED",
    AI_RetryError: "PROVIDER_REQUEST_FAILED",
    AI_UnsupportedFunctionalityError: "UNSUPPORTED_SDK_OPERATION",
    AI_NoImageGeneratedError: "NO_IMAGE_RESULT",
    AI_InvalidResponseDataError: "INVALID_PROVIDER_RESPONSE",
  };
  let value: any = error,
    code = "SDK_OR_CONNECTION_FAILURE",
    status: number | undefined;
  for (
    let n = 0;
    value && typeof value === "object" && n < 4;
    n++, value = value.cause
  ) {
    if (names[value.name]) code = names[value.name];
    if (
      Number.isInteger(value.statusCode) &&
      value.statusCode >= 400 &&
      value.statusCode <= 599
    )
      status = value.statusCode;
    const provider =
      knownProviderCode(value.code) ||
      knownProviderCode(value.data?.error?.code) ||
      knownProviderCode(value.error?.code);
    if (provider) code = provider;
  }
  return new ProviderRequestError(
    `${stageLabels[stage]} failed (${status ? `HTTP ${status}; ` : ""}${code}). No automatic retry was made.`,
  );
}
export async function responseErrorCode(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 8192) return;
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return knownProviderCode(
      JSON.parse(new TextDecoder().decode(bytes))?.error?.code,
    );
  } catch {
    return;
  } finally {
    await reader.cancel().catch(() => {});
  }
}
