// Provider citation control tokens are not user-facing prose. Real URL metadata
// remains the only source mapping; never invent numbered citations from tokens.
export function cleanProviderCitations(text: string) {
  return text.replace(/\uE200cite[^\uE201]*(?:\uE201|$)/g, "");
}
export class ProviderTextFilter {
  private pending = "";
  private discarding = false;
  push(text: string) {
    this.pending += text;
    let result = "";
    while (this.pending) {
      if (this.discarding) {
        const end = this.pending.indexOf("\uE201");
        if (end < 0) {
          this.pending = "";
          break;
        }
        this.pending = this.pending.slice(end + 1);
        this.discarding = false;
      }
      const i = this.pending.indexOf("\uE200");
      if (i < 0) {
        result += this.pending;
        this.pending = "";
        break;
      }
      result += this.pending.slice(0, i);
      this.pending = this.pending.slice(i);
      const end = this.pending.indexOf("\uE201");
      if (end >= 0) {
        const marker = this.pending.slice(0, end + 1);
        if (!marker.startsWith("\uE200cite")) result += marker;
        this.pending = this.pending.slice(end + 1);
        continue;
      }
      if (this.pending.length > 2048) {
        if (this.pending.startsWith("\uE200cite")) this.discarding = true;
        else result += this.pending;
        this.pending = "";
      }
      break;
    }
    return result;
  }
  finish() {
    const result =
      this.discarding || "\uE200cite".startsWith(this.pending)
        ? ""
        : cleanProviderCitations(this.pending);
    this.pending = "";
    this.discarding = false;
    return result;
  }
}
