import { parseDocument } from "htmlparser2";
import { Element, Text, type AnyNode } from "domhandler";

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"
]);

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ");
}

/**
 * Returns a completely flat, unformatted HTML representation of a node and its children.
 * This is used to "dry run" the length check.
 */
function serializeInline(node: AnyNode): string {
  if (node.type === "text") {
    return cleanText((node as Text).data);
  }
  if (node.type === "tag" || node.type === "script" || node.type === "style") {
    const el = node as Element;
    const attrs = Object.entries(el.attribs)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join("");

    if (VOID_TAGS.has(el.name.toLowerCase())) {
      return `<${el.name}${attrs}>`;
    }

    const open = `<${el.name}${attrs}>`;
    const close = `</${el.name}>`;
    const children = el.children.map(serializeInline).join("");
    return `${open}${children}${close}`;
  }
  return "";
}

function formatNodeRelative(
  node: AnyNode,
  maxLineLength: number,
  indentStr: string
): string {
  if (node.type === "text") {
    return cleanText((node as Text).data).trim();
  }

  if (node.type === "tag" || node.type === "script" || node.type === "style") {
    const el = node as Element;
    const isVoid = VOID_TAGS.has(el.name.toLowerCase());

    const attrs = Object.entries(el.attribs)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join("");
    const openTag = `<${el.name}${attrs}>`;

    if (isVoid) {
      return openTag;
    }

    const closeTag = `</${el.name}>`;

    // Check if it has any elements as children
    const hasElementChildren = el.children.some(
      (child) => child.type === "tag" || child.type === "script" || child.type === "style"
    );

    // Dry-run inline length
    const inlineString = serializeInline(el);

    // If it's a short inline element with no nested tags, keep it flat on one line
    if (!hasElementChildren && inlineString.length <= maxLineLength) {
      return inlineString;
    }

    // Otherwise, format structurally
    const childStrings: string[] = [];
    for (const child of el.children) {
      const formattedChild = formatNodeRelative(child, maxLineLength, indentStr);
      if (formattedChild) {
        childStrings.push(formattedChild);
      }
    }

    if (childStrings.length === 0) {
      return `${openTag}${closeTag}`;
    }

    // Indent all children's lines by one level relative to this node
    const indentedChildren = childStrings
      .map((child) => {
        return child
          .split("\n")
          .map((line) => indentStr + line)
          .join("\n");
      })
      .join("\n");

    return `${openTag}\n${indentedChildren}\n${closeTag}`;
  }

  return "";
}

/**
 * Formats an HTML string specifically for diff views.
 *
 * @param html The raw HTML string.
 * @param maxLineLength The threshold character length above which inline elements break structurally.
 * @param indentStr The indentation characters (e.g. "    ").
 */
export function formatHtmlForDiff(
  html: string,
  maxLineLength: number = 60,
  indentStr: string = "    "
): string {
  const doc = parseDocument(html);

  const formattedTopNodes = doc.children
    .map((node) => formatNodeRelative(node, maxLineLength, indentStr))
    .filter((str) => str.trim() !== "");

  return formattedTopNodes.join("\n");
}