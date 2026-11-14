import { z } from "zod";
import { compileCalculation, calculationGuide } from "./reply-calculations";
import { validDate } from "./reply-dates";
import {
  createLibrary,
  createParser,
  defineComponent,
  type ElementNode,
} from "@openuidev/lang-core";

// Data only: no generated JavaScript, URLs, Query/Mutation or model-defined actions.
const label = z.string().min(1).max(160).regex(/\S/);
const field = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
const format = z
  .string()
  .regex(/^(number|percent|[A-Z]{3}|\$[a-z][a-z0-9_]{0,39})$/);
const calculated = z.object({
  expression: z.string().min(1).max(500),
  format: format.optional(),
});
const filterConfig = z.object({
  selectField: field.optional(),
  selectColumn: z.number().int().min(0).max(7).optional(),
  maxField: field.optional(),
  maxColumn: z.number().int().min(0).max(7).optional(),
  sortField: field.optional(),
});
export const replySchemas = {
  Text: z.object({ text: z.string().min(1).max(4000) }),
  Table: z.object({
    headers: z.array(label).min(1).max(8),
    rows: z
      .array(z.array(z.union([z.string().max(500), calculated])).max(8))
      .max(100),
    filterField: z.union([field, filterConfig]).optional(),
    filterColumn: z.number().int().min(0).max(7).optional(),
  }),
  Chart: z.object({
    title: label,
    kind: z.enum(["bar", "line"]),
    points: z
      .array(
        z.object({
          label,
          value: z.union([z.number().min(-1e12).max(1e12), calculated]),
          category: label.optional(),
        }),
      )
      .min(1)
      .max(60),
    filterField: field.optional(),
  }),
  Select: z.object({
    name: field,
    label,
    options: z.array(label).min(1).max(12),
    initial: label,
  }),
  Slider: z.object({
    name: field,
    label,
    min: z.number().min(-1e9).max(1e9),
    max: z.number().min(-1e9).max(1e9),
    step: z.number().positive().finite(),
    initial: z.number().finite(),
  }),
  Number: z.object({
    name: field,
    label,
    min: z.number().min(-1e9).max(1e9),
    max: z.number().min(-1e9).max(1e9),
    step: z.number().positive().finite(),
    initial: z.number().finite(),
    unit: z.string().max(20).optional(),
  }),
  Metric: z.object({
    label,
    expression: z.string().min(1).max(500),
    format: format.optional(),
  }),
  DateInput: z.object({
    name: field,
    label,
    initial: z.string().max(10),
    required: z.boolean(),
    afterField: field.optional(),
  }),
  Input: z.object({
    name: field,
    label,
    initial: z.string().max(1000),
    required: z.boolean(),
  }),
  Submit: z.object({ label, intent: z.string().trim().min(1).max(500) }),
};
const descriptions: Record<keyof typeof replySchemas, string> = {
  Text: "A short explanation or heading. Keep long explanations in ordinary Markdown outside the controls.",
  Number:
    "A numeric control with a slider and exact numeric entry. min<max, positive step; unit such as USD, INR, %, years is optional. Use for amounts, rates, durations and budgets.",
  Metric:
    "A prominent local calculated result. expression is a QUOTED safe OpenUI arithmetic expression using declared numeric $fields; format number/percent/ISO currency. No Submit required to recalculate.",
  DateInput:
    "Native calendar button, NOT a text field. initial is YYYY-MM-DD or empty for undecided. afterField optionally names the start DateInput so this end date cannot precede it. Use two DateInputs for travel dates. Pair with a Select for flexible/undecided dates if needed.",
  Table:
    "Nylo's sortable table/card view. Rows must match headers. Cells are text or {expression,format?}. Optional third argument is a Select field name (with fourth argument column index), OR {selectField,selectColumn,maxField,maxColumn,sortField}. maxField names a Number budget and maxColumn contains plain numeric data; sortField names a Select whose choices equal numeric column headers, ranked descending. All selects every row. Use supplied facts only.",
  Chart:
    "Native bar/line chart. Category is optional; filterField connects a Select to categories. All shows every category. Values must come from supplied data or be clearly labelled sample data.",
  Select:
    "Local choice, no model request. initial must be one of options. Use All as an option for chart/table filters.",
  Slider:
    "Local numeric value, no model request. min < max; initial must lie on a step between them.",
  Input: "A labelled text field; required controls submission.",
  Submit:
    "One explicit button sends the labelled input values with intent as a readable follow-up. No automatic requests. At most one Submit per reply.",
};
const baseComponents = Object.entries(replySchemas).map(([name, props]) =>
  defineComponent({
    name,
    props,
    description: descriptions[name as keyof typeof replySchemas],
    component: null,
  }),
);
const baseChildren = z
  .array(
    z.union(
      baseComponents.map((c) => c.ref) as [
        (typeof baseComponents)[number]["ref"],
        (typeof baseComponents)[number]["ref"],
        ...(typeof baseComponents)[number]["ref"][],
      ],
    ),
  )
  .min(1)
  .max(12);
const groups = ["Section", "Details"].map((name) =>
  defineComponent({
    name,
    description:
      name === "Details"
        ? "Collapsed optional preferences. Do not hide required empty fields here."
        : "A titled group of related controls/results.",
    props: z.object({ title: label, children: baseChildren }),
    component: null,
  }),
);
export const replyComponents = [...baseComponents, ...groups];
const Root = defineComponent({
  name: "Root",
  description:
    "A vertical interactive section. Include Text explaining the controls. Keep forms short.",
  props: z.object({
    children: z
      .array(
        z.union(
          replyComponents.map((c) => c.ref) as [
            (typeof replyComponents)[number]["ref"],
            (typeof replyComponents)[number]["ref"],
            ...(typeof replyComponents)[number]["ref"][],
          ],
        ),
      )
      .min(1)
      .max(20),
  }),
  component: null,
});
export const replyLibrary = createLibrary({
  components: [Root, ...replyComponents],
  root: "Root",
});
const parser = createParser(replyLibrary.toJSONSchema());
export const interactiveInstructions =
  replyLibrary.prompt({
    toolCalls: false,
    bindings: false,
    builtinFunctions: false,
  }) +
  "\n" +
  calculationGuide;
export type ReplyValues = Record<string, string | number>;
export type InteractiveReply = {
  version: 1 | 2;
  fallbackOffset?: number;
  source: string;
  fallback: string;
  values: ReplyValues;
  submitted?: string;
};
export type ReplyNode = ElementNode;
type Control = {
  name: string;
  label: string;
  type: "Select" | "Slider" | "Input" | "Number" | "DateInput";
  afterField?: string;
  initial: string | number;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
};

const inspected = new Map<
  string,
  {
    nodes: ElementNode[];
    controls: Control[];
    submit: { label: string; intent: string } | undefined;
  }
>();
export function inspectReply(source: string) {
  const cached = inspected.get(source);
  if (cached) return cached;
  if (
    typeof source !== "string" ||
    source.length > 24000 ||
    source.split("\n").length > 200
  )
    throw new Error("Interactive reply is too large.");
  // Validate the entire assignment stream before the permissive upstream parser.
  // Component declarations/references are supported; trailing ignored code isn't.
  const names = new Set<string>();
  const allowed = new Set(["Root", ...replyComponents.map((c) => c.name)]);
  let position = 0,
    count = 0;
  while (position < source.length) {
    const rest = source.slice(position);
    const gap = /^[\s;]*/.exec(rest)![0].length;
    position += gap;
    if (position === source.length) break;
    const prefix = /^([a-zA-Z_]\w*)\s*=\s*([A-Z]\w*)\s*\(/.exec(
      source.slice(position),
    );
    if (
      !prefix ||
      ["__proto__", "constructor", "prototype"].includes(prefix[1]) ||
      names.has(prefix[1]) ||
      !allowed.has(prefix[2])
    )
      throw Error("Unsupported interactive declaration.");
    names.add(prefix[1]);
    if ((prefix[1] === "root") !== (prefix[2] === "Root"))
      throw Error("Invalid interactive root.");
    position += prefix[0].length;
    const stack = ["("];
    let quote = "",
      escaped = false;
    while (position < source.length && stack.length) {
      const c = source[position++];
      if (quote) {
        if (escaped) escaped = false;
        else if (c === "\\") escaped = true;
        else if (c === quote) quote = "";
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        continue;
      }
      if ("([{".includes(c)) {
        stack.push(c);
        if (stack.length > 24 || ++count > 2000)
          throw Error("Interactive nesting is too large.");
      } else if (")]}".includes(c) && stack.pop() !== "([{"[")]}".indexOf(c)])
        throw Error("Unbalanced interactive source.");
    }
    if (quote || stack.length) throw Error("Interactive reply is incomplete.");
  }
  if (!names.has("root")) throw Error("Missing interactive root.");
  const result = parser.parse(source);
  if (
    !result.root ||
    result.root.typeName !== "Root" ||
    result.meta.incomplete ||
    result.meta.errors.length ||
    result.meta.unresolved.length ||
    result.meta.orphaned.length ||
    result.rootExpression ||
    result.queryStatements.length ||
    result.mutationStatements.length ||
    Object.keys(result.stateDeclarations).length
  )
    throw new Error("Interactive reply is incomplete or unsupported.");
  const topNodes = result.root.props.children;
  if (!Array.isArray(topNodes)) throw Error("Invalid reply components.");
  const nodes = topNodes.flatMap((node: ElementNode) =>
    ["Section", "Details"].includes(node?.typeName)
      ? [
          node,
          ...(Array.isArray(node.props.children) ? node.props.children : []),
        ]
      : [node],
  );
  if (nodes.length < 1 || nodes.length > 20)
    throw new Error("Invalid reply components.");
  const controls: Control[] = [];
  let submit: { label: string; intent: string } | undefined;
  for (const node of [result.root, ...nodes] as ElementNode[]) {
    if (
      !node ||
      node.type !== "element" ||
      node.partial ||
      node.hasDynamicProps !== false
    )
      throw new Error("Only complete static components are supported.");
    if (node === result.root) continue;
    if (["Section", "Details"].includes(node.typeName)) {
      label.parse(node.props.title);
      if (
        !Array.isArray(node.props.children) ||
        !node.props.children.length ||
        node.props.children.length > 12 ||
        node.props.children.some(
          (child: ElementNode) =>
            !child ||
            child.type !== "element" ||
            !Object.hasOwn(replySchemas, child.typeName),
        ) ||
        (node.typeName === "Details" &&
          node.props.children.some((c: ElementNode) => c.props.required))
      )
        throw Error("Invalid optional section.");
      continue;
    }
    const schema = replySchemas[node.typeName as keyof typeof replySchemas];
    if (!schema) throw new Error("Unknown reply component.");
    const p = schema.parse(node.props) as Record<string, any>;
    if (
      node.typeName === "Table" &&
      (p.rows.some((r: string[]) => r.length !== p.headers.length) ||
        (typeof p.filterField === "string" &&
          (!Number.isInteger(p.filterColumn) ||
            p.filterColumn >= p.headers.length)))
    )
      throw new Error("Table columns do not match.");
    if (
      ["Select", "Slider", "Number", "Input", "DateInput"].includes(
        node.typeName,
      )
    ) {
      if (controls.some((c) => c.name === p.name))
        throw new Error("Duplicate input name.");
      if (
        node.typeName === "Select" &&
        (!p.options.includes(p.initial) ||
          new Set(p.options).size !== p.options.length)
      )
        throw new Error("Invalid selector options.");
      if (
        ["Slider", "Number"].includes(node.typeName) &&
        (!(p.max > p.min) ||
          p.max - p.min > 1e9 ||
          (p.max - p.min) / p.step > 1e6 ||
          !validNumber(p.max, p.min, p.max, p.step) ||
          !(node.typeName === "Number"
            ? typeof p.initial === "number" &&
              p.initial >= p.min &&
              p.initial <= p.max
            : validNumber(p.initial, p.min, p.max, p.step)))
      )
        throw new Error("Invalid slider range.");
      if (
        node.typeName === "DateInput" &&
        p.initial !== "" &&
        !validDate(p.initial)
      )
        throw Error("Invalid calendar date.");
      controls.push({ ...p, type: node.typeName } as Control);
    }
    if (node.typeName === "Submit") {
      if (submit) throw new Error("Only one submit button is supported.");
      submit = { label: String(p.label), intent: String(p.intent) };
    }
  }
  const numeric = new Set(
    controls
      .filter((c) => c.type === "Number" || c.type === "Slider")
      .map((c) => c.name),
  );
  const checkExpression = (expression: string) => {
    if (
      compileCalculation(expression).fields.some((name) => !numeric.has(name))
    )
      throw Error("Unknown numeric input in calculation.");
  };
  for (const node of nodes as ElementNode[]) {
    const p = node.props as Record<string, any>;
    const checkFormat = (f: unknown) => {
      if (typeof f === "string" && f.startsWith("$")) {
        const control = controls.find(
          (c) => c.name === f.slice(1) && c.type === "Select",
        );
        if (
          !control ||
          !control.options?.every((o) => /^(number|percent|[A-Z]{3})$/.test(o))
        )
          throw Error("Unknown format selector.");
      }
    };
    checkFormat(p.format);
    if (
      node.typeName === "Number" &&
      typeof p.unit === "string" &&
      p.unit.startsWith("$") &&
      !controls.some((c) => c.name === p.unit.slice(1) && c.type === "Select")
    )
      throw Error("Unknown unit selector.");
    if (node.typeName === "Metric") checkExpression(p.expression);
    if (node.typeName === "Chart")
      p.points.forEach((point: any) => {
        if (typeof point.value === "object") {
          checkExpression(point.value.expression);
          checkFormat(point.value.format);
        }
      });
    if (node.typeName === "Table") {
      p.rows.forEach((row: any[]) =>
        row.forEach((cell) => {
          if (typeof cell === "object") {
            checkExpression(cell.expression);
            checkFormat(cell.format);
          }
        }),
      );
      if (typeof p.filterField === "object") {
        const f = p.filterField;
        for (const [name, column, type] of [
          [f.selectField, f.selectColumn, "Select"],
          [f.maxField, f.maxColumn, "Number"],
        ]) {
          if (
            name &&
            (!controls.some(
              (c) =>
                c.name === name &&
                (c.type === type || (type === "Number" && c.type === "Slider")),
            ) ||
              !Number.isInteger(column) ||
              column >= p.headers.length)
          )
            throw Error("Invalid table filter.");
        }
        if (
          f.sortField &&
          !controls.some(
            (c) =>
              c.name === f.sortField &&
              c.type === "Select" &&
              c.options?.every((o) => p.headers.includes(o)),
          )
        )
          throw Error("Invalid table ranking.");
      }
    }
    const name = typeof p.filterField === "string" ? p.filterField : undefined;
    if (name && !controls.some((c) => c.name === name && c.type === "Select"))
      throw Error("Unknown filter selector.");
    if (
      node.typeName === "DateInput" &&
      p.afterField &&
      (!controls.some(
        (c) => c.name === p.afterField && c.type === "DateInput",
      ) ||
        p.afterField === p.name)
    )
      throw Error("Unknown start date.");
  }
  for (const control of controls.filter((c) => c.type === "DateInput")) {
    const seen = new Set<string>();
    let next: Control | undefined = control;
    while (next) {
      if (seen.has(next.name)) throw Error("Cyclic calendar range.");
      seen.add(next.name);
      next = controls.find((c) => c.name === next!.afterField);
    }
  }
  const parsed = { nodes: nodes as ElementNode[], controls, submit };
  if (inspected.size >= 32) inspected.delete(inspected.keys().next().value!);
  inspected.set(source, parsed);
  return parsed;
}
function validNumber(value: unknown, min: number, max: number, step: number) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    Math.abs((value - min) / step - Math.round((value - min) / step)) < 1e-6
  );
}
export function replyValues(source: string, input: unknown = {}): ReplyValues {
  const { controls } = inspectReply(source);
  const raw =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    controls.map((c) => {
      const value = Object.prototype.hasOwnProperty.call(raw, c.name)
        ? raw[c.name]
        : c.initial;
      const valid =
        c.type === "Select"
          ? typeof value === "string" && c.options!.includes(value)
          : c.type === "Slider"
            ? validNumber(value, c.min!, c.max!, c.step!)
            : c.type === "Number"
              ? typeof value === "number" &&
                Number.isFinite(value) &&
                value >= c.min! &&
                value <= c.max!
              : c.type === "DateInput"
                ? value === "" || validDate(value)
                : typeof value === "string" && value.length <= 1000;
      return [c.name, valid ? (value as string | number) : c.initial];
    }),
  );
}
export function readInteractiveReply(
  value: unknown,
): InteractiveReply | undefined {
  try {
    if (!value || typeof value !== "object") return;
    const r = value as InteractiveReply;
    if (
      ![1, 2].includes(r.version) ||
      typeof r.fallback !== "string" ||
      !r.fallback.trim() ||
      r.fallback.length > 4000
    )
      return;
    return {
      version: r.version,
      fallbackOffset:
        Number.isSafeInteger(r.fallbackOffset) &&
        r.fallbackOffset! >= 0 &&
        r.fallbackOffset! < 1e6
          ? r.fallbackOffset
          : undefined,
      source: r.source,
      fallback: r.fallback,
      values: replyValues(r.source, r.values),
      submitted:
        typeof r.submitted === "string"
          ? r.submitted.slice(0, 24000)
          : undefined,
    };
  } catch {
    return;
  }
}
export function replySubmission(reply: InteractiveReply, input: ReplyValues) {
  const { controls, submit } = inspectReply(reply.source);
  if (!submit) throw new Error("This reply has no submit action.");
  const values = replyValues(reply.source, input);
  if (controls.some((c) => c.required && !String(values[c.name]).trim()))
    throw new Error("Complete the required fields first.");
  if (
    controls.some(
      (c) =>
        c.type === "DateInput" &&
        c.afterField &&
        values[c.name] &&
        values[c.afterField] &&
        values[c.name] < values[c.afterField],
    )
  )
    throw Error("End date must not precede start date.");
  return `${submit.intent}\n\nMy choices:\n${controls.map((c) => `${c.label}: ${values[c.name]}`).join("\n")}`;
}

export function visibleReplyText(text: string, reply?: InteractiveReply) {
  const i = reply?.fallbackOffset;
  return reply &&
    i !== undefined &&
    text.slice(i, i + reply.fallback.length) === reply.fallback
    ? (text.slice(0, i) + text.slice(i + reply.fallback.length)).trim()
    : text;
}
