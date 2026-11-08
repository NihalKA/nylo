import type { AttachmentSource } from "./attachment-picker";
export type AttachmentFlow =
  | { kind: "idle" }
  | { kind: "menu" }
  | { kind: "closing"; source: AttachmentSource; operation: string }
  | { kind: "picking"; source: AttachmentSource; operation: string };
export type AttachmentEvent =
  | { type: "open" }
  | { type: "cancel" }
  | {
      type: "choose";
      source: AttachmentSource;
      operation: string;
      waitForDismiss: boolean;
    }
  | { type: "dismissed" }
  | { type: "finished"; operation: string };
export function attachmentFlowReducer(
  state: AttachmentFlow,
  event: AttachmentEvent,
): AttachmentFlow {
  if (event.type === "open")
    return state.kind === "idle" ? { kind: "menu" } : state;
  if (event.type === "cancel")
    return state.kind === "menu" ? { kind: "idle" } : state;
  if (event.type === "choose")
    return state.kind === "menu"
      ? {
          kind: event.waitForDismiss ? "closing" : "picking",
          source: event.source,
          operation: event.operation,
        }
      : state;
  if (event.type === "dismissed")
    return state.kind === "closing" ? { ...state, kind: "picking" } : state;
  return state.kind === "picking" && state.operation === event.operation
    ? { kind: "idle" }
    : state;
}
