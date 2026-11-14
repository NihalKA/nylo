import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  createLibrary,
  Renderer,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { marked, type Tokens } from "marked";
import { Text, TextInput } from "./typography";
import { Button } from "./ui";
import { theme } from "./theme";
import { DataTable } from "./rich-blocks";
import {
  replyLibrary,
  inspectReply,
  replySubmission,
  replyValues,
  type InteractiveReply,
  type ReplyValues,
} from "./interactive-reply";

type Host = {
  values: ReplyValues;
  disabled: boolean;
  change: (name: string, value: string | number) => void;
  submit: () => void;
  submitted: boolean;
  valid: boolean;
};
const HostContext = createContext<Host | null>(null);
const useHost = () => useContext(HostContext)!;
const frame = () => ({
  padding: 14,
  gap: 12,
  backgroundColor: theme.card,
  borderColor: theme.line,
  borderWidth: 1,
  borderRadius: 18,
});
const textStyle = () => ({ color: theme.ink, fontSize: 14, lineHeight: 22 });

function Table({ props }: ComponentRenderProps<any>) {
  const { values } = useHost();
  const filter = props.filterField ? values[props.filterField] : undefined;
  const rows = (props.rows as string[][]).filter(
    (r) => !filter || filter === "All" || r[props.filterColumn] === filter,
  );
  const cell = (text: string): Tokens.TableCell => ({
    text,
    tokens: marked.Lexer.lexInline(text),
    header: false,
    align: null,
  });
  const escape = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const raw = [
    props.headers.map(escape).join(" | "),
    props.headers.map(() => "---").join(" | "),
    ...rows.map((r) => r.map(escape).join(" | ")),
  ]
    .map((s) => `| ${s} |`)
    .join("\n");
  const table: Tokens.Table = {
    type: "table",
    raw,
    header: props.headers.map(cell),
    rows: rows.map((r) => r.map(cell)),
    align: props.headers.map(() => null),
  };
  return (
    <DataTable
      table={table}
      inline={(tokens) =>
        tokens.map((t) => ("text" in t ? String(t.text) : t.raw)).join("")
      }
    />
  );
}
type Point = { label: string; value: number; category?: string };
function Chart({ props }: ComponentRenderProps<any>) {
  const { values } = useHost();
  const [selected, setSelected] = useState<number | null>(null);
  const filter = props.filterField ? values[props.filterField] : undefined;
  const points = (props.points as Point[]).filter(
    (p) => !filter || filter === "All" || p.category === filter,
  );
  const low = Math.min(0, ...points.map((p) => p.value));
  const high = Math.max(0, ...points.map((p) => p.value));
  const range = high - low || 1;
  const y = (v: number) => 140 - ((v - low) / range) * 120;
  const chosen = selected === null ? undefined : points[selected];
  return (
    <View style={frame()}>
      <Text style={[textStyle(), { fontWeight: "600" }]}>{props.title}</Text>
      {!points.length ? (
        <Text style={textStyle()}>No data for this selection.</Text>
      ) : (
        <>
          <Text style={{ color: theme.sub, fontSize: 12 }}>
            {chosen
              ? `${chosen.label}: ${chosen.value}`
              : `Range ${low} to ${high}. Tap a value for details.`}
          </Text>
          <ScrollView horizontal>
            <View
              style={{ width: Math.max(240, points.length * 64), height: 190 }}
            >
              <View
                style={{
                  position: "absolute",
                  top: y(0),
                  width: "100%",
                  height: 1,
                  backgroundColor: theme.lineStrong,
                }}
              />
              {points.map((p, i) => {
                const x = i * 64 + 32;
                const next = points[i + 1];
                const dy = next ? y(next.value) - y(p.value) : 0;
                const length = Math.hypot(64, dy);
                return (
                  <React.Fragment key={i}>
                    {props.kind === "line" && next ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: x + 32 - length / 2,
                          top: y(p.value) + dy / 2,
                          width: length,
                          height: 2,
                          backgroundColor: theme.primary,
                          transform: [{ rotate: `${Math.atan2(dy, 64)}rad` }],
                        }}
                      />
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${p.label}: ${p.value}`}
                      onPress={() => setSelected(i)}
                      style={{
                        position: "absolute",
                        left: i * 64,
                        top: 0,
                        width: 64,
                        height: 188,
                      }}
                    >
                      {props.kind === "bar" ? (
                        <View
                          style={{
                            position: "absolute",
                            left: 14,
                            width: 36,
                            top: Math.min(y(0), y(p.value)),
                            height: Math.max(2, Math.abs(y(p.value) - y(0))),
                            borderRadius: 4,
                            backgroundColor:
                              selected === i ? theme.accent2 : theme.primary,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            position: "absolute",
                            left: 27,
                            top: y(p.value) - 5,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: theme.primary,
                          }}
                        />
                      )}
                      <Text
                        numberOfLines={1}
                        style={{
                          position: "absolute",
                          top: 146,
                          width: 64,
                          fontSize: 11,
                          textAlign: "center",
                          color: theme.sub,
                        }}
                      >
                        {p.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          position: "absolute",
                          top: 165,
                          width: 64,
                          fontSize: 11,
                          textAlign: "center",
                          color: theme.ink,
                        }}
                      >
                        {p.value}
                      </Text>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}
function Select({ props }: ComponentRenderProps<any>) {
  const host = useHost();
  return (
    <View style={{ gap: 8 }}>
      <Text style={textStyle()}>{props.label}</Text>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
      >
        {(props.options as string[]).map((option) => (
          <Pressable
            key={option}
            disabled={host.disabled}
            accessibilityRole="radio"
            accessibilityLabel={option}
            accessibilityState={{
              checked: host.values[props.name] === option,
              disabled: host.disabled,
            }}
            onPress={() => host.change(props.name, option)}
            style={{
              minHeight: 44,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.line,
              backgroundColor:
                host.values[props.name] === option
                  ? theme.selected
                  : theme.surface,
            }}
          >
            <Text style={textStyle()}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function Slider({ props }: ComponentRenderProps<any>) {
  const host = useHost();
  const [width, setWidth] = useState(1);
  const value = Number(host.values[props.name]);
  const set = (v: number) =>
    host.change(
      props.name,
      Number(
        Math.min(
          props.max,
          Math.max(
            props.min,
            props.min + Math.round((v - props.min) / props.step) * props.step,
          ),
        ).toFixed(8),
      ),
    );
  const touch = (x: number) => {
    if (!host.disabled)
      set(
        props.min +
          Math.max(0, Math.min(1, x / width)) * (props.max - props.min),
      );
  };
  return (
    <View style={{ gap: 6 }}>
      <Text style={textStyle()}>
        {props.label}: {value}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Button
          title="−"
          accessibilityLabel={`Decrease ${props.label}`}
          secondary
          disabled={host.disabled || value <= props.min}
          onPress={() => set(value - props.step)}
        />
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={props.label}
          accessibilityState={{ disabled: host.disabled }}
          accessibilityValue={{ min: props.min, max: props.max, now: value }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => {
            if (!host.disabled)
              set(
                value +
                  (e.nativeEvent.actionName === "increment"
                    ? props.step
                    : -props.step),
              );
          }}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => !host.disabled}
          onMoveShouldSetResponder={() => !host.disabled}
          onResponderGrant={(e) => touch(e.nativeEvent.locationX)}
          onResponderMove={(e) => touch(e.nativeEvent.locationX)}
          style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
        >
          <View
            pointerEvents="none"
            style={{ height: 5, borderRadius: 3, backgroundColor: theme.line }}
          >
            <View
              style={{
                width: `${((value - props.min) / (props.max - props.min)) * 100}%`,
                height: 5,
                backgroundColor: theme.primary,
              }}
            />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: `${((value - props.min) / (props.max - props.min)) * 100}%`,
              marginLeft: -10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: theme.primary,
            }}
          />
        </View>
        <Button
          title="+"
          accessibilityLabel={`Increase ${props.label}`}
          secondary
          disabled={host.disabled || value >= props.max}
          onPress={() => set(value + props.step)}
        />
      </View>
    </View>
  );
}
function Input({ props }: ComponentRenderProps<any>) {
  const host = useHost();
  return (
    <View style={{ gap: 6 }}>
      <Text style={textStyle()}>
        {props.label}
        {props.required ? " (required)" : ""}
      </Text>
      <TextInput
        accessibilityLabel={props.label}
        editable={!host.disabled}
        maxLength={1000}
        value={String(host.values[props.name] ?? "")}
        onChangeText={(value) => host.change(props.name, value)}
        style={{
          minHeight: 48,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.lineStrong,
          color: theme.ink,
          backgroundColor: theme.surface,
        }}
      />
    </View>
  );
}
function Submit({ props }: ComponentRenderProps<any>) {
  const host = useHost();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.sub, fontSize: 12, lineHeight: 18 }}>
        {props.intent}
      </Text>
      <Button
        title={host.submitted ? "Choices sent" : props.label}
        disabled={host.disabled || host.submitted || !host.valid}
        onPress={host.submit}
      />
    </View>
  );
}
const renderers: Record<string, React.FC<ComponentRenderProps<any>>> = {
  Root: ({ props, renderNode }) => (
    <View style={frame()}>
      {(props.children as unknown[]).map((node, i) => (
        <React.Fragment key={i}>{renderNode(node)}</React.Fragment>
      ))}
    </View>
  ),
  Text: ({ props }) => (
    <Text selectable style={textStyle()}>
      {props.text}
    </Text>
  ),
  Table,
  Chart,
  Select,
  Slider,
  Input,
  Submit,
};
const nativeLibrary = createLibrary({
  root: "Root",
  components: Object.values(replyLibrary.components).map((component) => ({
    ...component,
    component: renderers[component.name],
  })),
});

class ReplyBoundary extends React.Component<
  { fallback: string; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Text style={textStyle()}>{this.props.fallback}</Text>
    ) : (
      this.props.children
    );
  }
}

export function InteractiveContent({
  reply,
  disabled,
  onSave,
  onSubmit,
}: {
  reply: InteractiveReply;
  disabled: boolean;
  onSave: (values: ReplyValues) => Promise<void>;
  onSubmit: (values: ReplyValues) => Promise<void>;
}) {
  const initial = useMemo(
    () => replyValues(reply.source, reply.values),
    [reply.source],
  );
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const lock = useRef(false);
  const saveFailure = useRef(false);
  const change = (name: string, value: string | number) => {
    if (disabled || lock.current) return;
    const next = replyValues(reply.source, { ...values, [name]: value });
    setValues(next);
    queue.current = queue.current
      .catch(() => {})
      .then(() => onSave(next))
      .then(
        () => {
          saveFailure.current = false;
          setError("");
        },
        () => {
          saveFailure.current = true;
          setError(
            "Could not save these choices. Try changing the value again.",
          );
        },
      );
  };
  let submitted = false;
  let valid = false;
  try {
    submitted = reply.submitted === replySubmission(reply, values);
    valid = true;
  } catch {
    /* required field remains empty */
  }
  const submit = async () => {
    if (disabled || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      replySubmission(reply, values);
      await queue.current;
      if (saveFailure.current)
        throw new Error(
          "Save your choices before sending. Try changing the value again.",
        );
      await onSubmit(values);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send these choices.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  try {
    inspectReply(reply.source);
  } catch {
    return <Text style={textStyle()}>{reply.fallback}</Text>;
  }
  return (
    <ReplyBoundary fallback={reply.fallback}>
      <HostContext.Provider
        value={{
          values,
          disabled: disabled || busy,
          change,
          submit: () => void submit(),
          submitted,
          valid,
        }}
      >
        <Renderer
          response={reply.source}
          library={nativeLibrary}
          isStreaming={false}
          publishObservability={false}
          toolProvider={null}
        />
        {busy ? (
          <Text accessibilityLiveRegion="polite" style={textStyle()}>
            Sending choices…
          </Text>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.error }}>
            {error}
          </Text>
        ) : null}
      </HostContext.Provider>
    </ReplyBoundary>
  );
}
