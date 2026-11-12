import { syntheticJSONResponse, syntheticStreamResponse } from "./sdk-response";
import { runSDKAgent } from "./sdk-engine";
import { Attachment } from "./types";
import { checkSDKMultipartUpload } from "./sdk-upload-check";
import { supportedDocumentFormats } from "./document-files";

// An explicit, synthetic, offline diagnostic. This fetch never contacts a server.
export async function checkSDKOnDevice(
  onDocuments?: (files: Attachment[]) => void,
): Promise<Attachment> {
  const png =
    "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAKklEQVR4nGNQyY6gKWIYtWDUglELRi0YtWDUglELRi0YtWDUglELhooFAERenC4hY24CAAAAAElFTkSuQmCC";
  let chats = 0,
    images = 0;
  let file: Attachment | undefined;
  let text = "";
  const documents: Attachment[] = [];
  const failures: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    if (
      String(url) === "https://sdk-check.invalid/v1/images/generations" ||
      String(url) === "https://sdk-check.invalid/v1/images/edits"
    ) {
      if (String(url).endsWith("/images/edits"))
        await checkSDKMultipartUpload(init?.body, png);
      images++;
      return syntheticJSONResponse({ created: 1, data: [{ b64_json: png }] });
    }
    if (String(url) !== "https://sdk-check.invalid/v1/responses")
      throw new Error("Unexpected diagnostic destination.");
    chats++;
    const item =
      chats <= 4
        ? {
            type: "function_call",
            status: "completed",
            id: `fc_check_${chats}`,
            call_id: `call_check_${chats}`,
            name: chats <= 2 ? "generate_image" : "create_document",
            arguments: JSON.stringify(
              chats <= 2
                ? {
                    prompt: "synthetic offline image",
                    ...(chats === 2 ? { imageId: file?.id } : {}),
                  }
                : {
                    title:
                      chats === 3 ? "Offline SDK report" : "Offline SDK text",
                    format:
                      chats === 3 &&
                      (supportedDocumentFormats as readonly string[]).includes(
                        "pdf",
                      )
                        ? "pdf"
                        : "txt",
                    content:
                      "Synthetic offline sample. Not a live weather forecast.\n\n## Weather overview\n\nA clear morning is used here only as sample content.\n\n| Day | Conditions | High |\n| --- | --- | --- |\n| Sample day | Clear | 25 C |\n\n- Local document creation\n- No provider request\n\nCalculation: 7 x 12 = 84.",
                  },
            ),
          }
        : {
            type: "message",
            id: "msg_check",
            role: "assistant",
            status: "completed",
            content: [],
          };
    const events: unknown[] = [
      {
        type: "response.created",
        response: { id: "resp_check", created_at: 1, model: "synthetic" },
      },
      { type: "response.output_item.added", output_index: 0, item },
    ];
    if (chats > 4) {
      if (String(init?.body).includes(png))
        throw new Error("Diagnostic pixels were resent.");
      events.push({
        type: "response.output_text.delta",
        item_id: "msg_check",
        delta: "SDK_CHECK_OK",
      });
    }
    events.push(
      { type: "response.output_item.done", output_index: 0, item },
      {
        type: "response.completed",
        response: {
          usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
        },
      },
    );
    const bytes = new TextEncoder().encode(
      events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
    );
    let position = 0;
    return syntheticStreamResponse(
      new ReadableStream({
        pull(controller) {
          if (position >= bytes.length) controller.close();
          else {
            controller.enqueue(bytes.slice(position, position + 23));
            position += 23;
          }
        },
      }),
      { headers: { "content-type": "text/event-stream" } },
    );
  };
  await runSDKAgent({
    connection: {
      id: "sdk-check",
      name: "Offline check",
      protocol: "openai",
      baseUrl: "https://sdk-check.invalid/v1",
      model: "synthetic",
      imageModel: "synthetic-image",
    },
    key: "synthetic-not-a-real-key",
    instructions: "Use the image tool.",
    messages: [
      {
        id: "synthetic-user",
        role: "user",
        text: "Create a synthetic test image",
        createdAt: 1,
        status: "complete",
      },
    ],
    useTools: false,
    signal: new AbortController().signal,
    fetcher,
    onText: (delta) => {
      text += delta;
    },
    onAction: () => {},
    onToolDiagnostic: (error) => {
      failures.push(error instanceof Error ? error.message : String(error));
    },
    executeTool: async () => {
      throw new Error("Unexpected tool.");
    },
    approveImageEdit: async () => true,
    onFiles: async (files) => {
      for (const output of files) {
        if (output.mimeType.startsWith("image/")) file = output;
        else documents.push(output);
      }
    },
  });
  if (
    chats !== 5 ||
    documents.length !== 2 ||
    images !== 2 ||
    text !== "SDK_CHECK_OK" ||
    !file ||
    file.data !== png
  )
    throw new Error(
      `Offline SDK check: ${chats} chat steps, ${images} image calls, ${file ? "file received" : "no file"}, ${text === "SDK_CHECK_OK" ? "text passed" : "text mismatch"}. ${failures.join("; ")}`,
    );
  onDocuments?.(documents);
  return file;
}
