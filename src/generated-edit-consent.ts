import { AppData, Attachment, Connection } from "./types";
import { credentialDestination } from "./credentials";

function consent(data: AppData, connection: Connection) {
  return data.providerConsents?.find(
    (c) =>
      c.credentialId === (connection.credentialId || connection.id) &&
      c.destination === credentialDestination(connection) &&
      c.revision === 3,
  );
}
export function isGeneratedImage(
  data: AppData,
  chatId: string,
  image: Attachment,
) {
  return (
    image.mimeType.startsWith("image/") &&
    !!data.conversations
      .find((c) => c.id === chatId)
      ?.messages.some(
        (m) =>
          m.role === "assistant" &&
          m.generatedFiles?.some(
            (f) => f.id === image.id && f.data === image.data,
          ),
      )
  );
}
export function generatedEditApproved(
  data: AppData,
  chatId: string,
  connection: Connection,
  image: Attachment,
) {
  return (
    isGeneratedImage(data, chatId, image) &&
    !!consent(data, connection)?.generatedImageEditChats?.includes(chatId)
  );
}
export function rememberGeneratedEdits(
  data: AppData,
  chatId: string,
  connection: Connection,
) {
  const match = consent(data, connection);
  return data.providerConsents?.map((c) =>
    c === match
      ? {
          ...c,
          generatedImageEditChats: [
            ...new Set([...(c.generatedImageEditChats || []), chatId]),
          ],
        }
      : c,
  );
}
