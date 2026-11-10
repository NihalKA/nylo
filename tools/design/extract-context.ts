// Read-only retained MCP context extraction; never evaluates source or approves nodes.
import ts from "typescript";

export function extractContext(input: string, filename: string, frame: string) {
  const source = ts.createSourceFile(
    filename,
    input,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const nodes: Record<string, Record<string, unknown>> = {};
  function attributes(element: ts.JsxOpeningLikeElement) {
    const result: Record<string, string | null> = {};
    for (const attribute of element.attributes.properties) {
      if (!ts.isJsxAttribute(attribute)) continue;
      result[attribute.name.getText(source)] = attribute.initializer
        ? ts.isStringLiteral(attribute.initializer)
          ? attribute.initializer.text
          : attribute.initializer.getText(source)
        : null;
    }
    return result;
  }
  function contents(node: ts.Node) {
    const pieces: string[] = [];
    const unresolved: string[] = [];
    function read(child: ts.Node) {
      if (ts.isJsxText(child)) {
        if (child.text.trim()) pieces.push(child.text.trim());
      } else if (ts.isJsxExpression(child) && child.expression) {
        const expression = child.expression;
        if (
          ts.isStringLiteral(expression) ||
          ts.isNoSubstitutionTemplateLiteral(expression) ||
          ts.isNumericLiteral(expression)
        ) {
          pieces.push(expression.text);
        } else {
          unresolved.push(expression.getText(source));
        }
      } else if (ts.isJsxElement(child) || ts.isJsxFragment(child)) {
        child.children.forEach(read);
      }
    }
    if (ts.isJsxElement(node) || ts.isJsxFragment(node))
      node.children.forEach(read);
    return {
      text: pieces.join(" ").replace(/\s+/g, " ").trim(),
      unresolvedTextExpressions: unresolved,
    };
  }
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const attrs = attributes(opening);
      const id = attrs["data-node-id"];
      if (id) {
        if (nodes[id]) throw new Error(`Duplicate context node ${id}`);
        const paragraphs: {
          text: string;
          unresolvedTextExpressions: string[];
          className: string | null;
        }[] = [];
        const imageSlots: { symbol: string | null }[] = [];
        function descendants(child: ts.Node) {
          if (
            ts.isJsxElement(child) &&
            child.openingElement.tagName.getText(source) === "p"
          ) {
            paragraphs.push({
              ...contents(child),
              className: attributes(child.openingElement).className ?? null,
            });
          }
          if (
            ts.isJsxSelfClosingElement(child) &&
            child.tagName.getText(source) === "img"
          ) {
            imageSlots.push({
              symbol: attributes(child).src?.replace(/^\{|\}$/g, "") ?? null,
            });
          }
          ts.forEachChild(child, descendants);
        }
        descendants(node);
        nodes[id] = {
          frame,
          tag: opening.tagName.getText(source),
          name: attrs["data-name"] ?? null,
          className: attrs.className ?? null,
          style: attrs.style ?? null,
          ...contents(node),
          paragraphs,
          imageSlots,
          line:
            source.getLineAndCharacterOfPosition(node.getStart(source)).line +
            1,
        };
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return nodes;
}
