import {
  evaluate,
  parseExpression,
  tokenize,
  type ASTNode,
} from "@openuidev/lang-core";

// OpenUI's existing expression engine, restricted before evaluation. No actions,
// queries, assignments, property access, generated code or declaration references.
const definitions = {
  Payment: {
    names: ["principal", "annualRate", "years"],
    fn: (p: number, r: number, y: number) => {
      const n = y * 12;
      if (
        p < 0 ||
        r < 0 ||
        r > 100 ||
        y <= 0 ||
        y > 100 ||
        Math.abs(n - Math.round(n)) > 1e-6
      )
        throw Error("Invalid payment inputs");
      const monthly = r / 1200;
      return monthly === 0
        ? p / n
        : (p * monthly) / -Math.expm1(-n * Math.log1p(monthly));
    },
  },
  Power: {
    names: ["base", "exponent"],
    fn: (a: number, b: number) => Math.pow(a, b),
  },
  Min: { names: ["a", "b"], fn: Math.min },
  Max: { names: ["a", "b"], fn: Math.max },
  Round: {
    names: ["value", "places"],
    fn: (v: number, p: number) => {
      if (!Number.isInteger(p) || p < 0 || p > 8)
        throw Error("Invalid precision");
      return Number(v.toFixed(p));
    },
  },
};
const functions = Object.fromEntries(
  Object.entries(definitions).map(([name, def]) => [
    `Nylo${name}`,
    {
      params: {
        type: "object",
        properties: Object.fromEntries(
          def.names.map((n) => [n, { type: "number" }]),
        ),
        required: def.names,
      },
      returns: { type: "number" },
      fn: (args: Record<string, unknown>) => {
        const values = def.names.map((n) => args[n]);
        if (
          !values.every(
            (v) =>
              typeof v === "number" &&
              Number.isFinite(v) &&
              Math.abs(v) <= 1e15,
          )
        )
          throw Error("Invalid calculation input");
        return (def.fn as (...args: number[]) => number)(
          ...(values as number[]),
        );
      },
    },
  ]),
);
function canonical(node: ASTNode): string {
  switch (node.k) {
    case "Num":
      return String(node.v);
    case "StateRef":
      return node.n;
    case "UnaryOp":
      return `(${node.op}${canonical(node.operand)})`;
    case "BinOp":
      return `(${canonical(node.left)}${node.op}${canonical(node.right)})`;
    case "Comp":
      return `@${node.name}(${node.args.map(canonical).join(",")})`;
    default:
      throw Error("Unsupported calculation");
  }
}
const tokensKey = (s: string) =>
  JSON.stringify(
    tokenize(s)
      .filter((t) => ![1, 2, 13].includes(t.t))
      .map((t) => [t.t, t.v]),
  );
const cache = new Map<string, { ast: ASTNode; fields: string[] }>();
export function compileCalculation(expression: string) {
  const existing = cache.get(expression);
  if (existing) return existing;
  if (
    typeof expression !== "string" ||
    expression.length > 500 ||
    /\/[/\*]/.test(expression) ||
    !/^[\w\d\s.$@()+*/%,\-]+$/.test(expression)
  )
    throw Error("Invalid calculation syntax");
  let depth = 0;
  for (const c of expression) {
    if (c === "(" && ++depth > 16) throw Error("Calculation is too deep");
    if (c === ")" && --depth < 0) throw Error("Unbalanced calculation");
  }
  if (depth || tokenize(expression).length > 120)
    throw Error("Invalid calculation size");
  const ast = parseExpression(tokenize(expression));
  const fields = new Set<string>();
  let count = 0;
  const inspect = (n: ASTNode, d: number) => {
    if (++count > 64 || d > 16) throw Error("Calculation is too complex");
    if (n.k === "Num" && Number.isFinite(n.v) && Math.abs(n.v) <= 1e15) return;
    if (n.k === "StateRef" && /^\$[a-z][a-z0-9_]{0,39}$/.test(n.n)) {
      fields.add(n.n.slice(1));
      return;
    }
    if (n.k === "UnaryOp" && ["+", "-"].includes(n.op)) {
      inspect(n.operand, d + 1);
      return;
    }
    if (n.k === "BinOp" && ["+", "-", "*", "/", "%"].includes(n.op)) {
      inspect(n.left, d + 1);
      inspect(n.right, d + 1);
      return;
    }
    if (
      n.k === "Comp" &&
      Object.hasOwn(definitions, n.name) &&
      n.args.length ===
        definitions[n.name as keyof typeof definitions].names.length
    ) {
      n.args.forEach((a) => inspect(a, d + 1));
      return;
    }
    throw Error("Unsupported calculation operation");
  };
  inspect(ast, 0);
  // The upstream parser is deliberately permissive. Reject ignored trailing
  // tokens rather than treating a partially parsed formula as a valid answer.
  if (tokensKey(expression) !== tokensKey(canonical(ast)))
    throw Error("Incomplete calculation");
  const result = { ast, fields: [...fields] };
  if (cache.size >= 128) cache.delete(cache.keys().next().value!);
  cache.set(expression, result);
  return result;
}
export function calculate(
  expression: string,
  values: Record<string, string | number>,
) {
  const { ast, fields } = compileCalculation(expression);
  if (
    fields.some(
      (n) => typeof values[n] !== "number" || !Number.isFinite(values[n]),
    )
  )
    throw Error("Calculation needs numeric inputs");
  const context = {
    getState: (n: string) => values[n.replace(/^\$/, "")],
    resolveRef: () => null,
    functions,
  };
  const checked = (node: ASTNode): number => {
    let safe = node;
    if (node.k === "BinOp") {
      const left = checked(node.left),
        right = checked(node.right);
      if ((node.op === "/" || node.op === "%") && right === 0)
        throw Error("Division by zero");
      safe = {
        ...node,
        left: { k: "Num", v: left },
        right: { k: "Num", v: right },
      };
    } else if (node.k === "UnaryOp")
      safe = { ...node, operand: { k: "Num", v: checked(node.operand) } };
    else if (node.k === "Comp")
      safe = {
        ...node,
        name: `Nylo${node.name}`,
        fn: true,
        args: node.args.map((n) => ({ k: "Num", v: checked(n) })),
      };
    const result = evaluate(safe, context);
    if (
      typeof result !== "number" ||
      !Number.isFinite(result) ||
      Math.abs(result) > 1e15
    )
      throw Error("Calculation is outside the supported range");
    return result;
  };
  const value = checked(ast);
  return value;
}
export function formatResult(
  value: number,
  format = "number",
  values: Record<string, string | number> = {},
) {
  if (format.startsWith("$")) format = String(values[format.slice(1)]);
  if (!/^(number|percent|[A-Z]{3})$/.test(format))
    throw Error("Invalid result format");
  if (!Number.isFinite(value)) throw Error("Invalid numeric result");
  return (
    new Intl.NumberFormat(
      undefined,
      format === "percent"
        ? { maximumFractionDigits: 2 }
        : /^[A-Z]{3}$/.test(format)
          ? { style: "currency", currency: format }
          : { maximumFractionDigits: 2 },
    ).format(value) + (format === "percent" ? "%" : "")
  );
}
export const calculationGuide = `Calculators use Number(name,label,min,max,step,initial,unit?) and Metric(label,expression,format?). Number has a slider AND exact numeric entry. Expressions are QUOTED strings using $numeric_field, + - * / %, parentheses, @Payment(principal,annual_percent,years), @Power(base,exponent), @Min(a,b), @Max(a,b), @Round(value,places). Only declared Number/Slider fields may be referenced. Metric format is number, percent, an ISO currency such as INR/USD/AED, or "$currency" referencing a Select with ISO currency choices (this changes scenario units, not FX conversion). Example: Number("amount","Loan amount",0,10000000,1000,240000,"USD"), Number("rate","Annual interest",0,30,0.1,5,"%"), Number("years","Term",1,40,1,30,"years"), Metric("Monthly payment","@Payment($amount,$rate,$years)","USD"), Metric("Total interest","@Payment($amount,$rate,$years)*$years*12-$amount","USD"). Adjustments recalculate locally; no Submit is needed for calculations. Chart point values and table cells may use {expression:"$amount*2",format:"USD"} for derived values. Never supply JavaScript, queries, assignments or arbitrary functions.`;
