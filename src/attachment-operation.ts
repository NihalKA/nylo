const preparationFailure = () =>
  new Error(
    "This attachment took too long to prepare. Your draft is safe. Choose a smaller file and try again.",
  );

export function assertAttachmentActive(signal: AbortSignal) {
  if (signal.aborted) throw signal.reason || preparationFailure();
}

// Native work may finish after cancellation. Never publish that result; release
// its resources when it arrives without waiting for it to restore the UI.
export function attachmentStep<T>(
  pending: Promise<T>,
  signal: AbortSignal,
  discardLate?: (value: T) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let cancelled = signal.aborted;
    const abort = () => {
      cancelled = true;
      signal.removeEventListener("abort", abort);
      reject(signal.reason || preparationFailure());
    };
    if (cancelled) abort();
    else signal.addEventListener("abort", abort, { once: true });
    pending.then(
      (value) => {
        signal.removeEventListener("abort", abort);
        if (cancelled) {
          try {
            discardLate?.(value);
          } catch {}
        } else resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        if (!cancelled) reject(error);
      },
    );
  });
}

export async function prepareAttachments<T>(
  work: (signal: AbortSignal) => Promise<T>,
  timeoutMs = 20000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(preparationFailure()),
    timeoutMs,
  );
  try {
    return await attachmentStep(
      Promise.resolve().then(() => work(controller.signal)),
      controller.signal,
    );
  } finally {
    clearTimeout(timer);
  }
}
