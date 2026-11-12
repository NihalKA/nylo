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
export function messageTokens(text: string) {
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
