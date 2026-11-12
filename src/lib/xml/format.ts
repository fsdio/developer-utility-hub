/**
 * XML format/minify/validate engine.
 * Kebijakan fidelity: docs/adr/0003-xml-fidelity.md
 *
 * `DOMParser` adalah API browser, jadi parser diinjeksi sebagai parameter agar
 * engine tetap dapat diuji tanpa DOM global (technical-design §7).
 */
import { ok, err, type Result, type ToolError } from "@/types/result";

export type XmlIndent = 2 | 4 | "tab";

export interface XmlFormatOptions {
  indent?: XmlIndent;
  preserveComments?: boolean;
}

export interface XmlFormatResult {
  text: string;
  rootName: string;
  elementCount: number;
}

export interface XmlParseResult {
  rootName: string;
  elementCount: number;
}

const INDENT_UNIT: Record<string, string> = { "2": "  ", "4": "    ", tab: "\t" };

const NODE = {
  element: 1,
  text: 3,
  cdata: 4,
  processingInstruction: 7,
  comment: 8,
  document: 9,
} as const;

/** Normalisasi pesan parsererror menjadi ToolError. */
export function parserErrorMessage(raw: string): ToolError {
  const clean = raw.replace(/\s+/g, " ").trim();
  const location = /line[: ]+(\d+)(?:[^\d]+col(?:umn)?[: ]+(\d+))?/i.exec(clean);
  const line = location?.[1] ? Number(location[1]) : undefined;
  const column = location?.[2] ? Number(location[2]) : undefined;
  const error: ToolError = {
    kind: "parse",
    message:
      line !== undefined
        ? `XML tidak well-formed (baris ${line}${column !== undefined ? `, kolom ${column}` : ""}): ${clean}`
        : `XML tidak well-formed: ${clean}`,
  };
  if (line !== undefined) error.line = line;
  if (column !== undefined) error.column = column;
  return error;
}

const escapeText = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

const isWhitespaceOnly = (node: Node): boolean =>
  node.nodeType === NODE.text && (node.nodeValue ?? "").trim() === "";

interface SerializerState {
  unit: string;
  /** format = indentasi baru; minify = tanpa whitespace struktural. */
  mode: "format" | "minify";
  preserveComments: boolean;
  depth: number;
  /** true = jangan menambah padding/newline (di dalam elemen inline). */
  inline: boolean;
}

/**
 * Elemen dianggap "inline" bila isinya bukan hanya elemen/komentar —
 * yaitu berisi text (termasuk mixed content) atau CDATA. Indentasi ulang pada
 * isi seperti ini akan mengubah makna (ADR-0003 §3).
 */
function isInlineElement(el: Element): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === NODE.text && !isWhitespaceOnly(child)) return true;
    if (child.nodeType === NODE.cdata) return true;
  }
  return false;
}

function serializeNode(node: Node, state: SerializerState): string {
  const pad = state.inline || state.mode === "minify" ? "" : state.unit.repeat(state.depth);

  switch (node.nodeType) {
    case NODE.element: {
      const el = node as Element;
      const attrs = Array.from(el.attributes)
        .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
        .join("");
      const open = `${pad}<${el.nodeName}${attrs}`;

      // Whitespace-only antar elemen selalu dibuang: itu indentasi lama, bukan data.
      const children = Array.from(el.childNodes).filter((child) => !isWhitespaceOnly(child));

      if (children.length === 0) {
        return `${open} />`;
      }

      const inline = state.inline || isInlineElement(el);
      const childState: SerializerState = inline
        ? { ...state, inline: true }
        : { ...state, depth: state.depth + 1, inline: false };

      const inner = children.map((child) => serializeNode(child, childState)).join("");

      if (inline) {
        return `${open}>${inner}</${el.nodeName}>`;
      }

      return state.mode === "format"
        ? `${open}>\n${inner}\n${pad}</${el.nodeName}>`
        : `${open}>${inner}</${el.nodeName}>`;
    }
    case NODE.text: {
      const value = node.nodeValue ?? "";
      if (value.trim() === "") return "";
      // Di dalam elemen inline, teks dipakai apa adanya (whitespace bermakna).
      return state.inline ? escapeText(value) : `${pad}${escapeText(value.trim())}`;
    }
    case NODE.cdata: {
      // ADR-0003 §2: CDATA ditulis ulang sebagai text ter-escape.
      const value = node.nodeValue ?? "";
      return state.inline ? escapeText(value) : `${pad}${escapeText(value.trim())}`;
    }
    case NODE.comment: {
      if (!state.preserveComments) return "";
      return `${pad}<!--${node.nodeValue ?? ""}-->`;
    }
    case NODE.processingInstruction: {
      const pi = node as ProcessingInstruction;
      const data = pi.data && pi.data.length > 0 ? ` ${pi.data}` : "";
      return `${pad}<?${pi.target}${data}?>`;
    }
    case NODE.document: {
      const rootState: SerializerState = { ...state, depth: 0, inline: false };
      const pieces = Array.from(node.childNodes)
        .map((child) => serializeNode(child, rootState))
        .filter((piece) => piece !== "");
      return pieces.join(state.mode === "format" ? "\n" : "");
    }
    default:
      return "";
  }
}

interface ParsedDocument {
  doc: Document;
  root: Element;
}

function parseDocument(
  source: string,
  parse: (text: string) => Document,
): Result<ParsedDocument> {
  if (source.trim() === "") {
    return err({ kind: "parse", message: "Input masih kosong. Tempel XML terlebih dahulu." });
  }

  const doc = parse(source);
  const parserError =
    doc.getElementsByTagName("parsererror")[0] ??
    doc.getElementsByTagNameNS("*", "parsererror")[0];

  if (parserError) {
    return err(parserErrorMessage(parserError.textContent ?? "Kesalahan tidak diketahui"));
  }

  const root = doc.documentElement;
  if (!root) {
    return err({ kind: "parse", message: "Dokumen tidak memiliki elemen root." });
  }

  return ok({ doc, root });
}

function serialize(
  parsed: ParsedDocument,
  mode: "format" | "minify",
  options: XmlFormatOptions,
): XmlFormatResult {
  const { indent = 2, preserveComments = true } = options;
  const text = serializeNode(parsed.doc, {
    unit: INDENT_UNIT[String(indent)] ?? "  ",
    mode,
    preserveComments,
    depth: 0,
    inline: false,
  });

  return {
    text,
    rootName: parsed.root.nodeName,
    elementCount: parsed.doc.getElementsByTagName("*").length,
  };
}

export function formatXml(
  source: string,
  parse: (text: string) => Document,
  options: XmlFormatOptions = {},
): Result<XmlFormatResult> {
  const parsed = parseDocument(source, parse);
  if (!parsed.ok) return parsed;
  return ok(serialize(parsed.value, "format", options));
}

export function minifyXml(
  source: string,
  parse: (text: string) => Document,
  options: XmlFormatOptions = {},
): Result<XmlFormatResult> {
  const parsed = parseDocument(source, parse);
  if (!parsed.ok) return parsed;
  return ok(serialize(parsed.value, "minify", options));
}

export function validateXml(
  source: string,
  parse: (text: string) => Document,
): Result<XmlParseResult> {
  const parsed = parseDocument(source, parse);
  if (!parsed.ok) return parsed;
  return ok({
    rootName: parsed.value.root.nodeName,
    elementCount: parsed.value.doc.getElementsByTagName("*").length,
  });
}
