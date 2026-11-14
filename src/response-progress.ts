export type ResponseStage =
  "model" | "reply" | "image" | "document" | "saving" | "approval";
export const stageLabels: Record<ResponseStage, string> = {
  model: "Waiting for the model",
  reply: "Receiving reply",
  image: "Creating or editing image",
  document: "Creating document",
  saving: "Saving files",
  approval: "Waiting for your approval",
};
export const stageLimits: Record<ResponseStage, number> = {
  model: 120000,
  reply: 120000,
  image: 300000,
  document: 60000,
  saving: 60000,
  approval: 180000,
};
export type InterruptionReason =
  | "stopped"
  | "background-unavailable"
  | "background-expired"
  | "stage-timeout"
  | "total-timeout"
  | "storage";
// Activity can renew an idle wait, but never the finite ten-minute total limit.
export function createResponseClock(now: () => number = Date.now) {
  const startedAt = now();
  let stage: ResponseStage = "model",
    activityAt = startedAt;
  return {
    startedAt,
    get stage() {
      return stage;
    },
    enter(next: ResponseStage) {
      if (next !== stage) {
        stage = next;
        activityAt = now();
      }
    },
    activity() {
      activityAt = now();
    },
    expired(): InterruptionReason | undefined {
      if (now() - startedAt >= 600000) return "total-timeout";
      if (now() - activityAt >= stageLimits[stage]) return "stage-timeout";
    },
  };
}
export function interruptionMessage(
  reason: InterruptionReason,
  stage: ResponseStage,
) {
  const detail: Record<InterruptionReason, string> = {
    stopped: "You stopped this response.",
    "background-unavailable":
      "Nylo could not continue after the app moved to the background.",
    "background-expired":
      "The operating system ended the available background time.",
    "stage-timeout": `${stageLabels[stage]} timed out after ${stageLimits[stage] / 1000} seconds without progress.`,
    "total-timeout": "This response reached its ten-minute total limit.",
    storage:
      "The response stopped because it could not be saved on this device.",
  };
  return `${detail[reason]} Completed files and partial text are kept. Retry is a new request; saved files will not be regenerated automatically.`;
}
export function nextActionLabels(actions: string[] = [], label: string) {
  return [...actions.filter((a) => !a.endsWith("…")), label];
}
