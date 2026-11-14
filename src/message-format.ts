import { cleanProviderCitations } from "./provider-text";
import { marked } from "marked";
export type Source = { title: string; url: string };
export function safeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function messageTokens(text: string, partial = false) {
  text = cleanProviderCitations(text);
  // Do not promote the current unfinished Markdown table row to a comparison.
  if (partial && !text.endsWith("\n")) {
    const lines = text.split("\n");
    if (
      lines.at(-1)?.includes("|") &&
      lines.some((l) => /^\s*\|?\s*:?-{3,}/.test(l))
    ) {
      lines.pop();
      text = lines.join("\n");
    }
  }
  return marked.lexer(text, { gfm: true, breaks: true });
}
export function citationLabel(href: string, sources: Source[]) {
  const normalize = (value: string) => {
    const u = safeWebUrl(value);
    if (!u) return value;
    const url = new URL(u);
    url.hash = "";
    for (const k of [...url.searchParams.keys()])
      if (k.startsWith("utm_")) url.searchParams.delete(k);
    return url.href;
  };
  const i = sources.findIndex((s) => normalize(s.url) === normalize(href));
  return i < 0 ? undefined : `[${i + 1}]`;
}
