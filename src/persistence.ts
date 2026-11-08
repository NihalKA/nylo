// Serialize mutations and expose them only after durable storage succeeds.
// A failed write must not poison the queue or publish uncommitted UI state.
export function createDurableUpdater<T>(options: {
  read: () => T;
  write: (next: T) => Promise<void>;
  commit: (next: T) => void;
}) {
  let queue = Promise.resolve();
  return (change: (current: T) => T) => {
    const operation = queue
      .catch(() => {})
      .then(async () => {
        const next = change(options.read());
        await options.write(next);
        options.commit(next);
      });
    queue = operation;
    return operation;
  };
}

// A recovering write queue must not hide a failed response checkpoint.
export function createCheckpointBarrier(onFailure: () => void) {
  const writes: Promise<void>[] = [];
  let failed = false;
  let failure: unknown;
  return {
    track(write: Promise<void>) {
      const handled = write.catch((error) => {
        if (!failed) {
          failed = true;
          failure = error;
          onFailure();
        }
      });
      writes.push(handled);
      return handled;
    },
    async finish() {
      await Promise.all(writes);
      if (failed)
        throw failure instanceof Error
          ? failure
          : new Error("The response could not be saved.");
    },
  };
}
// Serialize whole multi-store transactions, including their asynchronous reads.
// Metadata serialization alone cannot protect a staged key from another save.
export function createSerialExecutor() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const operation = tail.then(task, task);
    tail = operation.catch(() => {});
    return operation;
  };
}
