import { z } from "zod";
import {
  createLibrary,
  createParser,
  defineComponent,
  type ElementNode,
} from "@openuidev/lang-core";

// Data only: no generated JavaScript, URLs, Query/Mutation or model-defined actions.
const label = z.string().min(1).max(160).regex(/\S/);
const field = z.string().regex(/^[a-z][a-z0-9_]{0,39}$/);
export const replySchemas = {
  Text: z.object({ text: z.string().min(1).max(4000) }),
  Table: z.object({
    headers: z.array(label).min(1).max(8),
    rows: z.array(z.array(z.string().max(500)).max(8)).max(100),
    filterField: field.optional(),
    filterColumn: z.number().int().min(0).max(7).optional(),
  }),
  Chart: z.object({
    title: label,
    kind: z.enum(["bar", "line"]),
    points: z
      .array(
        z.object({
          label,
          value: z.number().min(-1e12).max(1e12),
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
  Input: z.object({
    name: field,
    label,
    initial: z.string().max(1000),
    required: z.boolean(),
  }),
  Submit: z.object({ label, intent: z.string().trim().min(1).max(500) }),
};
const descriptions: Record<keyof typeof replySchemas, string> = {
  Text: "An explanation or heading.",
  Table:
    "Nylo's sortable table/card view. Rows must match headers. Optional filterField selects rows whose filterColumn equals the selected value; All shows every row.",
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
export const replyComponents = Object.entries(replySchemas).map(
  ([name, props]) =>
    defineComponent({
      name,
      props,
      description: descriptions[name as keyof typeof replySchemas],
      component: null,
    }),
);
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
export const interactiveInstructions = replyLibrary.prompt({
  toolCalls: false,
  bindings: false,
  builtinFunctions: false,
});
export type ReplyValues = Record<string, string | number>;
export type InteractiveReply = {
  version: 1;
  source: string;
  fallback: string;
  values: ReplyValues;
  submitted?: string;
};
export type ReplyNode = ElementNode;
type Control = {
  name: string;
  label: string;
  type: "Select" | "Slider" | "Input";
  initial: string | number;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
};

export function inspectReply(source: string) {
  if (
    typeof source !== "string" ||
    source.length > 24000 ||
    source.split("\n").length > 200
  )
    throw new Error("Interactive reply is too large.");
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
  const nodes = result.root.props.children;
  if (!Array.isArray(nodes) || nodes.length < 1 || nodes.length > 20)
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
    if (node.typeName === "Root") continue;
    const schema = replySchemas[node.typeName as keyof typeof replySchemas];
    if (!schema) throw new Error("Unknown reply component.");
    const p = schema.parse(node.props) as Record<string, any>;
    if (
      node.typeName === "Table" &&
      (p.rows.some((r: string[]) => r.length !== p.headers.length) ||
        (p.filterField &&
          (!Number.isInteger(p.filterColumn) ||
            p.filterColumn >= p.headers.length)))
    )
      throw new Error("Table columns do not match.");
    if (["Select", "Slider", "Input"].includes(node.typeName)) {
      if (controls.some((c) => c.name === p.name))
        throw new Error("Duplicate input name.");
      if (
        node.typeName === "Select" &&
        (!p.options.includes(p.initial) ||
          new Set(p.options).size !== p.options.length)
      )
        throw new Error("Invalid selector options.");
      if (
        node.typeName === "Slider" &&
        (!(p.max > p.min) ||
          p.max - p.min > 1e9 ||
          (p.max - p.min) / p.step > 1e6 ||
          !validNumber(p.max, p.min, p.max, p.step) ||
          !validNumber(p.initial, p.min, p.max, p.step))
      )
        throw new Error("Invalid slider range.");
      controls.push({ ...p, type: node.typeName } as Control);
    }
    if (node.typeName === "Submit") {
      if (submit) throw new Error("Only one submit button is supported.");
      submit = { label: String(p.label), intent: String(p.intent) };
    }
  }
  for (const node of nodes as ElementNode[]) {
    const name = node.props.filterField;
    if (name && !controls.some((c) => c.name === name && c.type === "Select"))
      throw new Error("Unknown filter selector.");
  }
  return { nodes: nodes as ElementNode[], controls, submit };
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
      r.version !== 1 ||
      typeof r.fallback !== "string" ||
      !r.fallback.trim() ||
      r.fallback.length > 4000
    )
      return;
    return {
      version: 1,
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
  return `${submit.intent}\n\nMy choices:\n${controls.map((c) => `${c.label}: ${values[c.name]}`).join("\n")}`;
}
