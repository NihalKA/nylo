import { AppData, Attachment, Connection } from "./types";
import { credentialDestination } from "./credentials";

function providerApproval(data: AppData, connection: Connection) {
  return data.providerConsents?.find(
    (c) =>
      c.credentialId === (connection.credentialId || connection.id) &&
      c.destination === credentialDestination(connection) &&
      c.revision === 3,
  );
}

// Picked files have immutable, fresh IDs. Approval is local, conversation-scoped,
// and belongs to the revocable provider consent; backup imports strip it.
export function pendingAttachmentApproval(
  data: AppData,
  conversationId: string,
  connection: Connection,
  attachments: Attachment[],
) {
  const approved = new Set(
    providerApproval(data, connection)?.attachmentApprovals?.find(
      (a) => a.conversationId === conversationId,
    )?.attachmentIds || [],
  );
  return attachments.filter((a) => !approved.has(a.id));
}

// Called in the durable message-acceptance write, only after all prompts succeed.
export function rememberAttachmentApproval(
  data: AppData,
  conversationId: string,
  connection: Connection,
  attachments: Attachment[],
) {
  const consent = providerApproval(data, connection);
  return data.providerConsents?.map((c) =>
    c !== consent || !attachments.length
      ? c
      : {
          ...c,
          attachmentApprovals: [
            ...(c.attachmentApprovals || []).filter(
              (a) => a.conversationId !== conversationId,
            ),
            {
              conversationId,
              attachmentIds: [...new Set(attachments.map((a) => a.id))],
            },
          ],
        },
  );
}
