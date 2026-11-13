import React, { useMemo } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { Token, Tokens } from "marked";
import { Text, fonts } from "./typography";
import { Icon, theme } from "./ui";
import { FadeIn } from "./motion";
import { rgba } from "./organic";
import { Callout, CodeBlock, DataTable } from "./rich-blocks";
import {
  citationLabel,
  messageTokens,
  safeWebUrl,
  Source,
} from "./message-format";

export function MessageContent({
  text,
  sources = [],
  animate,
}: {
  text: string;
  sources?: Source[];
  /** The reply is arriving now: new blocks glide in as they appear. */
  animate?: boolean;
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
          <CodeBlock key={i} code={t.text} lang={(t as Tokens.Code).lang} />
        );
      if (t.type === "list")
        return (
          <View key={i} style={{ gap: 8 }}>
            {(t as Tokens.List).items.map((item, j) => (
              <View key={j} style={{ flexDirection: "row", gap: 10 }}>
                {item.task ? (
                  <View style={{ paddingTop: 3 }}>
                    <Icon
                      name={
                        item.checked ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={16}
                      color={item.checked ? theme.accentText : theme.quiet}
                    />
                  </View>
                ) : t.ordered ? (
                  <Text
                    style={{
                      minWidth: 18,
                      color: theme.accentText,
                      fontWeight: "600",
                      lineHeight: 22,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {`${Number(t.start || 1) + j}.`}
                  </Text>
                ) : (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginTop: 8,
                      backgroundColor: rgba(theme.primary, 0.7),
                    }}
                  />
                )}
                <View style={{ flex: 1, gap: 8 }}>
                  {blocks(item.tokens || [])}
                </View>
              </View>
            ))}
          </View>
        );
      if (t.type === "blockquote")
        return (
          <Callout key={i} text={(t as Tokens.Blockquote).text}>
            {blocks(t.tokens || [])}
          </Callout>
        );
      if (t.type === "hr")
        return (
          <View
            key={i}
            style={{
              height: 1,
              marginVertical: 4,
              backgroundImage: `linear-gradient(90deg, ${rgba(theme.primary, 0)} 0%, ${rgba(theme.primary, 0.35)} 50%, ${rgba(theme.primary, 0)} 100%)`,
            }}
          />
        );
      if (t.type === "table")
        return (
          <DataTable
            key={i}
            table={t as Tokens.Table}
            inline={inline}
            animate={animate}
          />
        );
      const heading = t.type === "heading";
      return (
        <Text
          key={i}
          selectable
          style={{
            fontSize: heading
              ? (t as Tokens.Heading).depth <= 2
                ? 19
                : 16
              : 14,
            lineHeight: heading ? 26 : 22,
            color: heading ? theme.ink : theme.sub,
            fontWeight: heading
              ? (t as Tokens.Heading).depth <= 2
                ? "700"
                : "600"
              : "400",
            letterSpacing: heading ? -0.3 : 0,
            marginTop: heading ? 4 : 0,
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
  const top = blocks(tokens) as React.ReactNode[];
  return (
    <View style={{ gap: 14 }}>
      {top.map((node, i) =>
        node ? (
          <FadeIn key={i} enabled={!!animate} distance={6} duration={300}>
            {node}
          </FadeIn>
        ) : null,
      )}
    </View>
  );
}
