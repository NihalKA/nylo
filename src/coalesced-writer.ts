// One active write and one replaceable pending snapshot, regardless of gestures.
export class CoalescedWriter<T> {
  private pending: { value: T } | undefined;
  private active: Promise<void> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private error: unknown;
  constructor(
    private write: (value: T) => Promise<void>,
    private report: (failed: boolean) => void,
    private delay = 150,
  ) {}
  push(value: T) {
    this.pending = { value };
    if (!this.timer && !this.active)
      this.timer = setTimeout(() => {
        this.timer = undefined;
        this.start();
      }, this.delay);
  }
  private start() {
    if (this.active || !this.pending) return;
    const { value } = this.pending;
    this.pending = undefined;
    this.active = Promise.resolve()
      .then(() => this.write(value))
      .then(
        () => {
          this.error = undefined;
          this.report(false);
        },
        (e) => {
          this.error = e;
          this.report(true);
        },
      )
      .finally(() => {
        this.active = undefined;
        if (this.pending && !this.timer)
          this.timer = setTimeout(() => {
            this.timer = undefined;
            this.start();
          }, this.delay);
      });
  }
  async flush() {
    while (this.active || this.pending) {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
      this.start();
      await this.active;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    if (this.error)
      throw Error("Could not save these choices. Change a value to try again.");
  }
}
