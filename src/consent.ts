import { Alert, AppState, Platform } from "react-native";
import { createApprovalQueue } from "./approval-queue";
const approve = createApprovalQueue(
  () => !AppState.currentState || AppState.currentState === "active",
);

export function askPermission(
  title: string,
  message: string,
  action = "Allow",
  signal?: AbortSignal,
): Promise<boolean> {
  return approve(() => showPermission(title, message, action), false, signal);
}
async function showPermission(
  title: string,
  message: string,
  action = "Allow",
): Promise<boolean> {
  if (Platform.OS === "web") return window.confirm(`${title}\n\n${message}`);
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: "Not now", style: "cancel", onPress: () => resolve(false) },
        { text: action, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

export type ImageEditPermission = "once" | "chat" | "cancel";
export function askImageEditPermission(
  message: string,
  generated: boolean,
  signal?: AbortSignal,
): Promise<ImageEditPermission> {
  return approve(
    () => showImageEditPermission(message, generated),
    "cancel",
    signal,
  );
}
async function showImageEditPermission(
  message: string,
  generated: boolean,
): Promise<ImageEditPermission> {
  if (!generated)
    return (await showPermission(
      "Send this image for editing?",
      message,
      "Edit image",
    ))
      ? "once"
      : "cancel";
  if (Platform.OS === "web") {
    if (!window.confirm(`Send this generated image for editing?\n${message}`))
      return "cancel";
    return window.confirm(
      "Allow further generated-image edits in this chat with this provider? You can revoke this in AI providers using Reset sharing approval.",
    )
      ? "chat"
      : "once";
  }
  return new Promise((resolve) =>
    Alert.alert(
      "Send this image for editing?",
      `${message} You can allow generated-image edits in this chat with this provider. Reset sharing approval in AI providers to revoke it.`,
      [
        { text: "Not now", style: "cancel", onPress: () => resolve("cancel") },
        { text: "Edit once", onPress: () => resolve("once") },
        { text: "Allow edits in this chat", onPress: () => resolve("chat") },
      ],
      { cancelable: true, onDismiss: () => resolve("cancel") },
    ),
  );
}
