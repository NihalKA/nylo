import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  createLibrary,
  Renderer,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import DatePicker from "./reply-date-picker";
import { calculate, formatResult } from "./reply-calculations";
import { validDate, localDate, dateValue } from "./reply-dates";
import { CoalescedWriter } from "./coalesced-writer";
import { marked, type Tokens } from "marked";
import { Text, TextInput } from "./typography";
import { Button } from "./ui";
import { theme } from "./theme";
import { DataTable } from "./rich-blocks";
import { MessageContent } from "./message-content";
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
  submitDisabled: boolean;
  commit: () => void;
  inputValidity: (name: string, valid: boolean) => void;
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
  const config =
    typeof props.filterField === "object"
      ? props.filterField
      : { selectField: props.filterField, selectColumn: props.filterColumn };
  const filter = config.selectField ? values[config.selectField] : undefined;
  const maximum = config.maxField ? values[config.maxField] : undefined;
  let rows = (props.rows as any[][])
    .map((row) =>
      row.map((value) => {
        if (typeof value === "string") return value;
        try {
          return formatResult(
            calculate(value.expression, values),
            value.format,
            values,
          );
        } catch {
          return "Calculation unavailable";
        }
      }),
    )
    .filter(
      (r) =>
        (!filter || filter === "All" || r[config.selectColumn] === filter) &&
        (typeof maximum !== "number" ||
          (/^-?\d+(\.\d+)?$/.test(r[config.maxColumn]) &&
            Number(r[config.maxColumn]) <= maximum)),
    );
  const column = config.sortField
    ? props.headers.indexOf(values[config.sortField])
    : -1;
  if (column >= 0)
    rows = [...rows].sort((a, b) => Number(b[column]) - Number(a[column]));
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
  let calculationFailed = false;
  const resolved = (props.points as any[]).map((p) => {
    try {
      return {
        ...p,
        value:
          typeof p.value === "number"
            ? p.value
            : calculate(p.value.expression, values),
      } as Point;
    } catch {
      calculationFailed = true;
      return { ...p, value: 0 } as Point;
    }
  });
  const points = resolved.filter(
    (p) => !filter || filter === "All" || p.category === filter,
  );
  if (calculationFailed)
    return (
      <Text style={textStyle()}>
        Calculation unavailable. Check the numeric inputs.
      </Text>
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
function Slider({
  props,
  exact = false,
}: ComponentRenderProps<any> & { exact?: boolean }) {
  const host = useHost();
  const [width, setWidth] = useState(1);
  const value = Number(host.values[props.name]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  const inputValidity = host.inputValidity;
  useEffect(
    () => () => inputValidity(props.name, true),
    [inputValidity, props.name],
  );
  useEffect(() => {
    if (!editing && !invalid) setDraft(String(value));
  }, [value, editing, invalid]);
  const set = (v: number) => {
    setInvalid(false);
    host.inputValidity(props.name, true);
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
  };
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
        {props.unit
          ? ` ${props.unit.startsWith("$") ? host.values[props.unit.slice(1)] : props.unit}`
          : ""}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Button
          title="−"
          accessibilityLabel={`Decrease ${props.label}`}
          secondary
          disabled={host.disabled || value <= props.min}
          onPress={() => {
            set(value - props.step);
            host.commit();
          }}
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
          onResponderRelease={host.commit}
          onResponderTerminate={host.commit}
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
          onPress={() => {
            set(value + props.step);
            host.commit();
          }}
        />
      </View>
      {exact ? (
        <>
          <TextInput
            accessibilityLabel={`Exact ${props.label}`}
            keyboardType="decimal-pad"
            editable={!host.disabled}
            value={draft}
            onFocus={() => setEditing(true)}
            onChangeText={(text) => {
              setDraft(text);
              const n = Number(text);
              const valid =
                /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim()) &&
                Number.isFinite(n) &&
                n >= props.min &&
                n <= props.max;
              host.inputValidity(props.name, valid);
              setInvalid(!valid);
              if (valid) host.change(props.name, n);
            }}
            onBlur={() => {
              setEditing(false);
              host.commit();
            }}
            style={{
              minHeight: 44,
              padding: 12,
              color: theme.ink,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: invalid ? theme.error : theme.lineStrong,
              borderRadius: 12,
            }}
          />
          {editing ? (
            <Button
              secondary
              title="Done editing"
              accessibilityLabel={`Finish editing ${props.label}`}
              onPress={() => {
                Keyboard.dismiss();
                setEditing(false);
                host.commit();
              }}
            />
          ) : null}
          {invalid ? (
            <Text accessibilityRole="alert" style={{ color: theme.error }}>
              Enter a number from {props.min} to {props.max}.
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
function Metric({ props }: ComponentRenderProps<any>) {
  const { values } = useHost();
  let result: string;
  try {
    result = formatResult(
      calculate(props.expression, values),
      props.format,
      values,
    );
  } catch {
    result = "Calculation unavailable. Check the numeric inputs.";
  }
  return (
    <View style={frame()}>
      <Text style={textStyle()}>{props.label}</Text>
      <Text
        accessibilityLiveRegion="polite"
        style={[
          textStyle(),
          { fontSize: 22, lineHeight: 30, fontWeight: "600" },
        ]}
      >
        {result}
      </Text>
    </View>
  );
}
function CalendarInput({ props }: ComponentRenderProps<any>) {
  const host = useHost();
  const value = String(host.values[props.name] || "");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(new Date());
  const minimum =
    props.afterField && validDate(host.values[props.afterField])
      ? localDate(String(host.values[props.afterField]))
      : localDate("1900-01-01");
  const maximum = localDate("2200-12-31");
  const commit = (date: Date) => {
    host.change(props.name, dateValue(date));
    host.commit();
    setOpen(false);
  };
  return (
    <View style={{ gap: 8 }}>
      <Text style={textStyle()}>
        {props.label}
        {props.required ? " (required)" : ""}
      </Text>
      <Button
        secondary
        title={value ? localDate(value).toLocaleDateString() : "Choose date"}
        accessibilityLabel={`Choose ${props.label}`}
        disabled={host.disabled}
        onPress={() => {
          const chosen = value ? localDate(value) : new Date();
          setPending(
            chosen < minimum ? minimum : chosen > maximum ? maximum : chosen,
          );
          setOpen(true);
        }}
      />
      {value ? (
        <Button
          secondary
          title="Clear date"
          accessibilityLabel={`Clear ${props.label}`}
          disabled={host.disabled}
          onPress={() => {
            host.change(props.name, "");
            host.commit();
          }}
        />
      ) : null}
      {minimum && value && value < dateValue(minimum) ? (
        <Text accessibilityRole="alert" style={{ color: theme.error }}>
          End date must not precede start date.
        </Text>
      ) : null}
      {open && Platform.OS === "android" ? (
        <DatePicker
          value={pending}
          mode="date"
          minimumDate={minimum}
          maximumDate={maximum}
          onChange={(event, date) => {
            if (event.type === "set" && date) commit(date);
            else setOpen(false);
          }}
        />
      ) : null}
      <Modal
        visible={open && Platform.OS !== "android"}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 20,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        >
          <ScrollView
            contentContainerStyle={frame()}
            style={{ flexGrow: 0, maxHeight: "85%" }}
          >
            <Text style={[textStyle(), { fontWeight: "600" }]}>
              {props.label}
            </Text>
            {open ? (
              <DatePicker
                value={pending}
                mode="date"
                display="inline"
                minimumDate={minimum}
                maximumDate={maximum}
                onChange={(_, date) => {
                  if (date) setPending(date);
                }}
              />
            ) : null}
            <Button
              title="Use date"
              disabled={!!minimum && dateValue(pending) < dateValue(minimum)}
              onPress={() => commit(pending)}
            />
            <Button
              secondary
              title="Cancel date selection"
              onPress={() => setOpen(false)}
            />
          </ScrollView>
        </View>
      </Modal>
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
        onBlur={host.commit}
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
        disabled={
          host.disabled || host.submitDisabled || host.submitted || !host.valid
        }
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
  Text: ({ props }) => <MessageContent text={props.text} />,
  Section: ({ props, renderNode }) => (
    <View style={frame()}>
      <Text style={[textStyle(), { fontWeight: "600" }]}>{props.title}</Text>
      {props.children.map((node: unknown, i: number) => (
        <React.Fragment key={i}>{renderNode(node)}</React.Fragment>
      ))}
    </View>
  ),
  Details: function Details({ props, renderNode }) {
    const [open, setOpen] = useState(false);
    return (
      <View style={{ gap: 10 }}>
        <Button
          secondary
          title={`${open ? "Hide" : "Show"} ${props.title}`}
          onPress={() => setOpen(!open)}
        />
        {open
          ? props.children.map((node: unknown, i: number) => (
              <React.Fragment key={i}>{renderNode(node)}</React.Fragment>
            ))
          : null}
      </View>
    );
  },
  Table,
  Chart,
  Select,
  Slider,
  Number: (args) => <Slider {...args} exact />,
  Metric,
  DateInput: CalendarInput,
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

function InteractiveHost({
  reply,
  disabled,
  submitDisabled = disabled,
  onSave,
  onSubmit,
}: {
  reply: InteractiveReply;
  disabled: boolean;
  submitDisabled?: boolean;
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
  const [invalidInputs, setInvalidInputs] = useState<Set<string>>(new Set());
  const invalidRef = useRef(new Set<string>());
  const inputValidity = useCallback((name: string, valid: boolean) => {
    const next = new Set(invalidRef.current);
    if (valid) next.delete(name);
    else next.add(name);
    invalidRef.current = next;
    setInvalidInputs(next);
  }, []);
  const lock = useRef(false);
  const current = useRef(initial);
  const mounted = useRef(true);
  const saver = useRef(onSave);
  saver.current = onSave;
  const writer = useRef<CoalescedWriter<ReplyValues> | null>(null);
  if (!writer.current)
    writer.current = new CoalescedWriter(
      (v) => saver.current(v),
      (failed) => {
        if (mounted.current)
          setError(
            failed
              ? "Could not save these choices. Change a value to try again."
              : "",
          );
      },
    );
  const commit = () => {
    void writer.current!.flush().catch(() => {});
  };
  useEffect(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") commit();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      commit();
    };
  }, []);
  const change = (name: string, value: string | number) => {
    if (disabled || lock.current) return;
    try {
      const next = replyValues(reply.source, {
        ...current.current,
        [name]: value,
      });
      current.current = next;
      setValues(next);
      writer.current!.push(next);
    } catch {
      setError("These controls could not update. Your saved choices are kept.");
    }
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
    if (disabled || submitDisabled || lock.current || invalidRef.current.size)
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      replySubmission(reply, values);
      await writer.current!.flush();
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
          valid: valid && !invalidInputs.size,
          inputValidity,
          submitDisabled,
          commit,
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

export function InteractiveContent(
  props: React.ComponentProps<typeof InteractiveHost>,
) {
  return (
    <ReplyBoundary key={props.reply.source} fallback={props.reply.fallback}>
      <InteractiveHost {...props} />
    </ReplyBoundary>
  );
}
