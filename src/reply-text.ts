import { inspectReply } from "./interactive-reply";
import { ProviderTextFilter } from "./provider-text";

// A provider can mistakenly serialize UI into its text channel. Hold a leading
// assignment until complete, then recover text-only answers without exposing DSL.
export class ReplyTextFilter {
  private citations = new ProviderTextFilter();
  private pending = "";
  private mode: "prefix" | "text" | "source" = "prefix";
  push(value: string) {
    const text = this.citations.push(value);
    if (this.mode === "text") return text;
    this.pending += text;
    if (this.mode === "source") {
      if (this.pending.length > 24000)
        this.pending = this.pending.slice(0, 24001);
      return "";
    }
    if (
      /^\s*root\s*=/.test(this.pending) ||
      /^\s*[a-zA-Z_]\w*\s*=\s*[A-Z]\w*\s*\(/.test(this.pending)
    ) {
      this.mode = "source";
      return "";
    }
    if (
      this.pending.length < 160 &&
      /^\s*[a-zA-Z_]*\s*(?:=\s*[A-Za-z_]*\s*)?$/.test(this.pending)
    )
      return "";
    this.mode = "text";
    const result = this.pending;
    this.pending = "";
    return result;
  }
  finish() {
    const rest = this.push(this.citations.finish());
    let result = rest;
    if (this.mode === "prefix") result += this.pending;
    if (this.mode === "source") {
      try {
        const { nodes } = inspectReply(this.pending);
        if (!nodes.every((n) => n.typeName === "Text"))
          throw Error("Missing tool call");
        result += nodes.map((n) => String(n.props.text)).join("\n\n");
      } catch {
        result +=
          "The interactive reply could not be displayed. Please try again.";
      }
    }
    this.mode = "prefix";
    this.pending = "";
    return result;
  }
}
