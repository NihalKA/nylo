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
