import { createSerialExecutor } from "./persistence";

// Keep a displayed native prompt in the queue until it is dismissed, even when
// its request is stopped. Its caller can return immediately without allowing a
// second alert to replace it or interpreting a stale approval as consent.
export function createApprovalQueue(canShow: () => boolean) {
  const serial = createSerialExecutor();
  return <T>(
    show: () => Promise<T>,
    cancelled: T,
    signal?: AbortSignal,
  ): Promise<T> => {
    if (signal?.aborted) return Promise.resolve(cancelled);
    return new Promise<T>((resolve, reject) => {
      const abort = () => resolve(cancelled);
      signal?.addEventListener("abort", abort, { once: true });
      void serial(async () => {
        if (signal?.aborted || !canShow()) return cancelled;
        const choice = await show();
        return signal?.aborted || !canShow() ? cancelled : choice;
      })
        .then(resolve, reject)
        .finally(() => signal?.removeEventListener("abort", abort));
    });
  };
}
