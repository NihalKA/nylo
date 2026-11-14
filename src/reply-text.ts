import { inspectReply } from "./interactive-reply";
import { ProviderTextFilter } from "./provider-text";

const declaration =
  /\b[a-zA-Z_]\w*\s*=\s*(?:Root|Text|Table|Chart|Select|Slider|Number|Metric|DateInput|Input|Submit|Section|Details)\s*\(/;
// Keep a bounded lookbehind so declaration names, fences and preambles are
// recognized independently of provider chunk boundaries. No source is executed.
export class ReplyTextFilter {
  private citations = new ProviderTextFilter();
  private pending = "";
  private source = false;
  push(value: string) {
    this.pending += this.citations.push(value);
    if (!this.source) {
      const match = declaration.exec(this.pending);
      if (match) {
        const prefix = this.pending
          .slice(0, match.index)
          .replace(/(^|\n)[ \t]*```[^\n]*\n?[ \t]*$/, "$1");
        this.pending = this.pending.slice(match.index, match.index + 24001);
        this.source = true;
        return prefix;
      }
      if (this.pending.length > 160) {
        const text = this.pending.slice(0, -160);
        this.pending = this.pending.slice(-160);
        return text;
      }
    } else if (this.pending.length > 24000)
      this.pending = this.pending.slice(0, 24001);
    return "";
  }
  finish() {
    let result = this.push(this.citations.finish());
    if (this.source) {
      try {
        const source = this.pending.replace(/\s*```\s*$/, "").trim();
        const { nodes } = inspectReply(source);
        if (!nodes.every((n) => n.typeName === "Text"))
          throw Error("Missing tool call");
        result += nodes.map((n) => String(n.props.text)).join("\n\n");
      } catch {
        result +=
          "The interactive reply could not be displayed. Please try again.";
      }
    } else result += this.pending;
    this.source = false;
    this.pending = "";
    return result;
  }
}
