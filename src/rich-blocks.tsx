import React, { useMemo, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Tokens } from "marked";
import { Text, fonts } from "./typography";
import { FadeIn, Tappable } from "./motion";
import { rgba } from "./organic";
import { theme } from "./theme";
import { Icon } from "./ui";
import { haptic } from "./haptics";

type Cell = Tokens.TableCell;
type Inline = (tokens: Cell["tokens"]) => React.ReactNode;

const NUMBER = /^[\s$€£₹¥+-]*[\d,]*\.?\d+\s*(%|[kKmMbB])?\s*$/;
const numeric = (text: string) =>
  NUMBER.test(text)
    ? Number(text.replace(/[^\d.-]/g, "")) *
      (/[kK]\s*$/.test(text)
        ? 1e3
        : /[mM]\s*$/.test(text)
          ? 1e6
          : /[bB]\s*$/.test(text)
            ? 1e9
            : 1)
    : NaN;

/** Copy text, with a short "Copied" confirmation on the button. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tappable
      accessibilityRole="button"
      accessibilityLabel={copied ? "Copied" : label}
      onPress={() => {
        void Clipboard.setStringAsync(text).then(() => {
          haptic.select();
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      scaleTo={0.92}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minHeight: 32,
        paddingHorizontal: 10,
        borderRadius: 16,
        backgroundColor: copied ? rgba(theme.primary, 0.14) : "transparent",
      }}
    >
      <Icon
        name={copied ? "checkmark" : "copy-outline"}
        size={14}
        color={copied ? theme.accentText : theme.sub}
      />
      <Text
        maxFontSizeMultiplier={1.3}
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: copied ? theme.accentText : theme.sub,
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Text>
    </Tappable>
  );
}

function Pill({
  options,
  value,
  onChange,
}: {
  options: {
    value: string;
    icon: React.ComponentProps<typeof Icon>["name"];
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        padding: 3,
        borderRadius: 14,
        backgroundColor: theme.muted,
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Tappable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(o.value)}
            scaleTo={0.94}
            style={{
              width: 34,
              height: 26,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? theme.card : "transparent",
              boxShadow: selected ? theme.cardShadow : undefined,
            }}
          >
            <Icon
              name={o.icon}
              size={14}
              color={selected ? theme.accentText : theme.quiet}
            />
          </Tappable>
        );
      })}
    </View>
  );
}

const PREVIEW_ROWS = 6;

/**
 * A reply table that feels native: tinted header, tap a column to sort,
 * numbers right-aligned, tap a row to highlight it, switch to cards on a
 * small screen, and copy it back as Markdown.
 */
export function DataTable({
  table,
  inline,
  animate,
}: {
  table: Tokens.Table;
  inline: Inline;
  animate?: boolean;
}) {
  const { width, fontScale } = useWindowDimensions();
  const columns = table.header.length;
  const [view, setView] = useState<"table" | "cards">(
    columns > 3 && width < 420 ? "cards" : "table",
  );
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [sortedOnce, setSortedOnce] = useState(false);

  const isNumeric = useMemo(
    () =>
      table.header.map((_, c) => {
        const values = table.rows
          .map((r) => r[c]?.text.trim() || "")
          .filter(Boolean);
        return values.length > 0 && values.every((v) => !isNaN(numeric(v)));
      }),
    [table],
  );
  const widths = useMemo(
    () =>
      table.header.map((h, c) => {
        const longest = Math.max(
          h.text.length,
          ...table.rows.map((r) => (r[c]?.text || "").length),
        );
        return Math.round(
          Math.min(240, Math.max(88, longest * 7.4 + 34)) *
            Math.min(fontScale, 1.4),
        );
      }),
    [table, fontScale],
  );
  const order = useMemo(() => {
    const index = table.rows.map((_, i) => i);
    if (!sort) return index;
    const { col, dir } = sort;
    return index.sort((a, b) => {
      const x = table.rows[a][col]?.text.trim() || "";
      const y = table.rows[b][col]?.text.trim() || "";
      if (isNumeric[col]) return (numeric(x) - numeric(y)) * dir;
      return x.localeCompare(y, undefined, { numeric: true }) * dir;
    });
  }, [table, sort, isNumeric]);
  const visible = expanded ? order : order.slice(0, PREVIEW_ROWS);
  const hidden = order.length - visible.length;
  const markdown = useMemo(() => table.raw.trim(), [table]);
  const toggleSort = (col: number) => {
    haptic.select();
    setSortedOnce(true);
    setSort((s) =>
      s?.col !== col ? { col, dir: 1 } : s.dir === 1 ? { col, dir: -1 } : null,
    );
  };
  const align = (c: number) =>
    table.align[c] === "center"
      ? "center"
      : table.align[c] === "right" || isNumeric[c]
        ? "right"
        : "left";
  const rowsAnimate = animate || sortedOnce;
  const sortKey = sort ? `${sort.col}:${sort.dir}` : "none";

  return (
    <View
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.hairline,
        backgroundColor: theme.card,
        boxShadow: theme.cardShadow,
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingLeft: 12,
          paddingRight: 6,
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: theme.hairline,
        }}
      >
        <Icon name="grid-outline" size={14} color={theme.accentText} />
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={{ flex: 1, fontSize: 12, fontWeight: "600", color: theme.sub }}
        >
          {table.rows.length} {table.rows.length === 1 ? "row" : "rows"}
          {sort
            ? ` · by ${table.header[sort.col]?.text} ${sort.dir === 1 ? "↑" : "↓"}`
            : ""}
        </Text>
        <Pill
          value={view}
          onChange={(v) => {
            haptic.select();
            setView(v as "table" | "cards");
          }}
          options={[
            { value: "table", icon: "grid-outline", label: "Table view" },
            { value: "cards", icon: "albums-outline", label: "Card view" },
          ]}
        />
        <CopyButton text={markdown} label="Copy table" />
      </View>

      {view === "table" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: rgba(theme.primary, 0.07),
              }}
            >
              {table.header.map((cell, c) => {
                const active = sort?.col === c;
                return (
                  <Tappable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={`Sort by ${cell.text}${active ? (sort!.dir === 1 ? ", ascending" : ", descending") : ""}`}
                    onPress={() => toggleSort(c)}
                    style={{
                      width: widths[c],
                      minHeight: 40,
                      paddingHorizontal: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent:
                        align(c) === "right"
                          ? "flex-end"
                          : align(c) === "center"
                            ? "center"
                            : "flex-start",
                      gap: 4,
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        letterSpacing: 0.2,
                        color: active ? theme.accentText : theme.ink,
                      }}
                    >
                      {inline(cell.tokens)}
                    </Text>
                    <Icon
                      name={
                        active
                          ? sort!.dir === 1
                            ? "arrow-up"
                            : "arrow-down"
                          : "swap-vertical"
                      }
                      size={11}
                      color={active ? theme.accentText : theme.quiet}
                    />
                  </Tappable>
                );
              })}
            </View>
            {/* Rows */}
            <View key={sortKey}>
              {visible.map((r, i) => {
                const row = table.rows[r];
                const on = selected === r;
                return (
                  <FadeIn
                    key={r}
                    enabled={rowsAnimate}
                    delay={Math.min(i, 8) * 30}
                    distance={6}
                    duration={240}
                  >
                    <Tappable
                      accessibilityRole="button"
                      accessibilityLabel={row
                        .map(
                          (cell, c) => `${table.header[c]?.text}: ${cell.text}`,
                        )
                        .join(", ")}
                      accessibilityState={{ selected: on }}
                      onPress={() => setSelected(on ? null : r)}
                      style={{
                        flexDirection: "row",
                        borderTopWidth: 1,
                        borderTopColor: theme.hairline,
                        backgroundColor: on
                          ? rgba(theme.primary, 0.1)
                          : i % 2
                            ? rgba(theme.ink, 0.025)
                            : "transparent",
                      }}
                    >
                      {row.map((cell, c) => (
                        <View
                          key={c}
                          style={{
                            width: widths[c],
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            selectable
                            style={{
                              fontSize: 13,
                              lineHeight: 19,
                              textAlign: align(c),
                              color: c === 0 ? theme.ink : theme.sub,
                              fontWeight: c === 0 ? "600" : "400",
                              fontVariant: isNumeric[c]
                                ? ["tabular-nums"]
                                : undefined,
                            }}
                          >
                            {inline(cell.tokens)}
                          </Text>
                        </View>
                      ))}
                    </Tappable>
                  </FadeIn>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View key={sortKey} style={{ padding: 10, gap: 8 }}>
          {visible.map((r, i) => {
            const row = table.rows[r];
            return (
              <FadeIn
                key={r}
                enabled={rowsAnimate || view === "cards"}
                delay={Math.min(i, 8) * 40}
                distance={8}
                duration={260}
              >
                <View
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    gap: 6,
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.hairline,
                    backgroundImage: `radial-gradient(circle at 0% 0%, ${rgba(theme.primary, 0.08)} 0%, ${rgba(theme.primary, 0)} 60%)`,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.ink,
                    }}
                  >
                    {inline(row[0]?.tokens || [])}
                  </Text>
                  {row.slice(1).map((cell, c) => (
                    <View
                      key={c}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "baseline",
                      }}
                    >
                      <Text
                        style={{
                          width: "38%",
                          fontSize: 12,
                          fontWeight: "600",
                          color: theme.quiet,
                        }}
                      >
                        {table.header[c + 1]?.text}
                      </Text>
                      <Text
                        selectable
                        style={{
                          flex: 1,
                          fontSize: 13,
                          lineHeight: 19,
                          color: theme.sub,
                          fontVariant: isNumeric[c + 1]
                            ? ["tabular-nums"]
                            : undefined,
                        }}
                      >
                        {inline(cell.tokens)}
                      </Text>
                    </View>
                  ))}
                </View>
              </FadeIn>
            );
          })}
          {view === "cards" ? (
            <SortChips header={table.header} sort={sort} onSort={toggleSort} />
          ) : null}
        </View>
      )}

      {hidden > 0 || expanded ? (
        <Tappable
          accessibilityRole="button"
          onPress={() => {
            haptic.select();
            setExpanded(!expanded);
          }}
          style={{
            minHeight: 40,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderTopWidth: 1,
            borderTopColor: theme.hairline,
          }}
        >
          <Text
            style={{ fontSize: 13, fontWeight: "600", color: theme.accentText }}
          >
            {expanded ? "Show less" : `Show all ${order.length} rows`}
          </Text>
          <Icon
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={theme.accentText}
          />
        </Tappable>
      ) : null}
    </View>
  );
}

/** Sorting for card view, where there is no header row to tap. */
function SortChips({
  header,
  sort,
  onSort,
}: {
  header: Cell[];
  sort: { col: number; dir: 1 | -1 } | null;
  onSort: (col: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingTop: 2 }}
    >
      <Text
        style={{
          fontSize: 12,
          color: theme.quiet,
          alignSelf: "center",
          marginRight: 2,
        }}
      >
        Sort
      </Text>
      {header.map((h, c) => {
        const active = sort?.col === c;
        return (
          <Tappable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${h.text}`}
            onPress={() => onSort(c)}
            scaleTo={0.94}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              minHeight: 30,
              paddingHorizontal: 10,
              borderRadius: 15,
              borderWidth: 1,
              borderColor: active ? rgba(theme.primary, 0.4) : theme.hairline,
              backgroundColor: active ? theme.pale : theme.card,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: active ? theme.accentText : theme.sub,
              }}
            >
              {h.text}
            </Text>
            {active ? (
              <Icon
                name={sort!.dir === 1 ? "arrow-up" : "arrow-down"}
                size={11}
                color={theme.accentText}
              />
            ) : null}
          </Tappable>
        );
      })}
    </ScrollView>
  );
}

/** A code block with its language and a copy button. */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.hairline,
        backgroundColor: theme.surface,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 14,
          paddingRight: 4,
          minHeight: 36,
          borderBottomWidth: 1,
          borderBottomColor: theme.hairline,
        }}
      >
        <Icon name="code-slash-outline" size={13} color={theme.quiet} />
        <Text
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 12,
            fontWeight: "600",
            color: theme.quiet,
          }}
        >
          {lang?.trim() || "Code"}
        </Text>
        <CopyButton text={code} label="Copy code" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

const calloutKinds = [
  {
    match: /^\s*(\[!)?(warning|caution|important)\b/i,
    color: "#C2650F",
    icon: "warning-outline",
  },
  { match: /^\s*(\[!)?(tip|hint)\b/i, color: "#1F8A4C", icon: "bulb-outline" },
  {
    match: /^\s*(\[!)?(note|info)\b/i,
    color: "",
    icon: "information-circle-outline",
  },
] as const;

/** Quotes become soft callouts; "Tip:", "Note:", "Warning:" pick a tone. */
export function Callout({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const kind = calloutKinds.find((k) => k.match.test(text));
  const color = kind?.color || theme.primary;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: rgba(color, 0.08),
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      {kind ? (
        <Icon
          name={kind.icon}
          size={17}
          color={kind.color || theme.accentText}
        />
      ) : null}
      <View style={{ flex: 1, gap: 8 }}>{children}</View>
    </View>
  );
}
