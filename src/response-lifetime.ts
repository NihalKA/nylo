// One finite native lease per response. Stale events cannot stop a later send.
export type ResponseLeaseAdapter = {
  begin: (token: string) => Promise<boolean>;
  end: (token: string) => Promise<void>;
  subscribe: (expired: (token: string) => void) => () => void;
};
export async function acquireResponseLease(
  adapter: ResponseLeaseAdapter | null,
  token: string,
  interrupt: () => void,
  signal?: AbortSignal,
) {
  let held = false;
  let expired = false;
  let released = false;
  let unsubscribe: (() => void) | undefined;
  const end = () => {
    // Also contain synchronous adapter failures; cleanup must not mask a response.
    try {
      void adapter?.end(token).catch(() => {});
    } catch {
      /* best effort native cleanup */
    }
  };
  const release = () => {
    if (released) return;
    released = true;
    held = false;
    signal?.removeEventListener("abort", onAbort);
    try {
      unsubscribe?.();
    } catch {
      /* cleanup must remain idempotent */
    }
    end();
  };
  let cancelBegin: (() => void) | undefined;
  const onAbort = () => {
    release();
    cancelBegin?.();
  };
  const lease = {
    get held() {
      return held;
    },
    release,
  };
  if (!adapter || signal?.aborted) return lease;
  try {
    unsubscribe = adapter.subscribe((id) => {
      if (released || expired || id !== token) return;
      expired = true;
      held = false;
      interrupt();
    });
    signal?.addEventListener("abort", onAbort, { once: true });
    const cancelled = new Promise<boolean>((resolve) => {
      cancelBegin = () => resolve(false);
    });
    const beginning = Promise.resolve(adapter.begin(token)).then((granted) => {
      // begin may resolve after Stop/deadline. Dispose its late native task too.
      if (released && granted) end();
      return granted;
    });
    if (signal?.aborted) onAbort();
    held =
      (await Promise.race([beginning, cancelled])) && !expired && !released;
  } catch {
    // Denied or unavailable assertions leave the response foreground-only.
    held = false;
  }
  cancelBegin = undefined;
  return lease;
}
