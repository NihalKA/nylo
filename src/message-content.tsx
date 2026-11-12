import React, { useMemo } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { Token, Tokens } from "marked";
import { Text, fonts } from "./typography";
import { theme } from "./ui";
import {
  citationLabel,
  messageTokens,
  safeWebUrl,
  Source,
} from "./message-format";

export function MessageContent({
  text,
  sources = [],
}: {
  text: string;
  sources?: Source[];
}) {
  const tokens = useMemo(() => messageTokens(text), [text]);
  const inline = (tokens: Token[] | undefined): React.ReactNode =>
    tokens?.map((t, i) => {
      if (t.type === "br") return "\n";
      if (t.type === "link") {
        const token = t as Tokens.Link;
        const href = safeWebUrl(token.href);
        return (
          <Text
            key={i}
            accessibilityRole={href ? "link" : undefined}
            accessibilityLabel={href ? `Open link: ${token.text}` : undefined}
            style={href ? { color: theme.accentText } : undefined}
            onPress={
              href
                ? () => {
                    void Linking.openURL(href).catch(() =>
                      Alert.alert(
                        "Could not open link",
                        "Please try again later.",
                      ),
                    );
                  }
                : undefined
            }
          >
            {citationLabel(
              token.href,
              sources.filter((source) => !!safeWebUrl(source.url)),
            ) || inline(token.tokens)}
          </Text>
        );
      }
      if (t.type === "strong" || t.type === "em" || t.type === "del")
        return (
          <Text
            key={i}
            style={
              t.type === "strong"
                ? { fontWeight: "600", color: theme.ink }
                : t.type === "em"
                  ? { fontStyle: "italic" }
                  : { textDecorationLine: "line-through" }
            }
          >
            {inline((t as Tokens.Strong).tokens)}
          </Text>
        );
      if (t.type === "codespan")
        return (
          <Text
            key={i}
            style={{ fontFamily: fonts.mono, backgroundColor: theme.surface }}
          >
            {t.text}
          </Text>
        );
      if (t.type === "image")
        return <Text key={i}>{(t as Tokens.Image).text}</Text>;
      // HTML remains literal text; never execute model markup or remote images.
      return "tokens" in t && t.tokens
        ? inline(t.tokens as Token[])
        : "text" in t
          ? String(t.text)
          : t.raw;
    });
  const blocks = (tokens: Token[]): React.ReactNode =>
    tokens.map((t, i) => {
      if (t.type === "space") return null;
      if (t.type === "code")
        return (
          <ScrollView
            key={i}
            horizontal
            style={{ backgroundColor: theme.surface, borderRadius: 12 }}
          >
            <Text
              selectable
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                lineHeight: 20,
                padding: 14,
                color: theme.ink,
              }}
            >
              {t.text}
            </Text>
          </ScrollView>
        );
      if (t.type === "list")
        return (
          <View key={i} style={{ gap: 8 }}>
            {(t as Tokens.List).items.map((item, j) => (
              <View key={j} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ color: theme.sub, lineHeight: 22 }}>
                  {t.ordered ? `${Number(t.start || 1) + j}.` : "•"}
                </Text>
                <View style={{ flex: 1, gap: 8 }}>
                  {blocks(item.tokens || [])}
                </View>
              </View>
            ))}
          </View>
        );
      if (t.type === "blockquote")
        return (
          <View
            key={i}
            style={{
              borderLeftWidth: 3,
              borderLeftColor: theme.lineStrong,
              paddingLeft: 12,
              gap: 8,
            }}
          >
            {blocks(t.tokens || [])}
          </View>
        );
      if (t.type === "hr")
        return (
          <View key={i} style={{ height: 1, backgroundColor: theme.line }} />
        );
      if (t.type === "table") {
        const table = t as Tokens.Table;
        return (
          <ScrollView horizontal key={i}>
            <View>
              {[table.header, ...table.rows].map((row, r) => (
                <View key={r} style={{ flexDirection: "row" }}>
                  {row.map((cell, c) => (
                    <View
                      key={c}
                      style={{
                        width: 180,
                        padding: 10,
                        borderWidth: 0.5,
                        borderColor: theme.line,
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          color: theme.ink,
                          fontWeight: r === 0 ? "600" : "400",
                        }}
                      >
                        {inline(cell.tokens)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );
      }
      const heading = t.type === "heading";
      return (
        <Text
          key={i}
          selectable
          style={{
            fontSize: heading
              ? (t as Tokens.Heading).depth <= 2
                ? 20
                : 17
              : 14,
            lineHeight: heading ? 27 : 22,
            color: heading ? theme.ink : theme.sub,
            fontWeight: heading ? "600" : "400",
          }}
        >
          {"tokens" in t
            ? inline(t.tokens as Token[])
            : "text" in t
              ? String(t.text)
              : t.raw}
        </Text>
      );
    });
  return <View style={{ gap: 14 }}>{blocks(tokens)}</View>;
}
