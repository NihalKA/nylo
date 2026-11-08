export type ServerEvent = { event: string; data: string };

// Handles CR, LF, and CRLF, including CRLF split across network chunks.
export class EventDecoder {
  private buffer = "";
  private event = "";
  private lines: string[] = [];
  private skipLF = false;
  constructor(private emit: (event: ServerEvent) => void) {}
  push(chunk: string) {
    for (const char of chunk) {
      if (this.skipLF) {
        this.skipLF = false;
        if (char === "\n") continue;
      }
      if (char === "\r" || char === "\n") {
        this.line(this.buffer);
        this.buffer = "";
        this.skipLF = char === "\r";
      } else this.buffer += char;
    }
  }
  finish() {
    if (this.buffer) this.line(this.buffer);
    this.buffer = "";
    this.line("");
  }
  private line(line: string) {
    if (!line) {
      if (this.lines.length)
        this.emit({
          event: this.event || "message",
          data: this.lines.join("\n"),
        });
      this.event = "";
      this.lines = [];
      return;
    }
    if (line.startsWith(":")) return;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") this.event = value;
    if (field === "data") this.lines.push(value);
  }
}
