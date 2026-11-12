/**
 * JSON format/minify/validate engine — murni, tanpa DOM.
 * PRD §6.2.
 */
import { ok, err, type Result, type ToolError } from "@/types/result";
import { locateErrorOffset } from "@/lib/json/locate";

export type JsonIndent = 2 | 4 | "tab";

export interface JsonStats {
  rootType: string;
  keys: number;
  maxDepth: number;
}

export interface JsonFormatResult {
  text: string;
  stats: JsonStats;
}

/** Ubah offset karakter menjadi 1-based line & column. */
export function offsetToLineColumn(
  source: string,
  offset: number,
): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < clamped; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, column: clamped - lineStart + 1 };
}

/** Cuplikan 3 baris di sekitar posisi error, dengan penanda `^`. */
export function errorExcerpt(source: string, line: number, column: number): string {
  const lines = source.split("\n");
  const from = Math.max(0, line - 2);
  const to = Math.min(lines.length, line + 1);
  const width = String(to).length;
  const out: string[] = [];
  for (let i = from; i < to; i += 1) {
    const isTarget = i === line - 1;
    const no = String(i + 1).padStart(width, " ");
    out.push(`${isTarget ? ">" : " "} ${no} | ${lines[i] ?? ""}`);
    if (isTarget) {
      out.push(`  ${" ".repeat(width)} | ${" ".repeat(Math.max(0, column - 1))}^`);
    }
  }
  return out.join("\n");
}

interface ErrorLocation {
  /** Offset karakter, bila tersedia. */
  offset?: number;
  /** Posisi eksplisit dari mesin (lebih akurat bila ada). */
  line?: number;
  column?: number;
}

/**
 * Ambil lokasi error dari pesan SyntaxError. V8 modern memberi
 * "at position N (line L column C)"; versi lain hanya "position N" atau "line L".
 */
export function extractLocation(message: string): ErrorLocation {
  const location: ErrorLocation = {};

  const positionMatch = /(?:at\s+)?position\s+(\d+)/i.exec(message);
  if (positionMatch?.[1]) location.offset = Number(positionMatch[1]);

  const lineMatch = /line\s+(\d+)/i.exec(message);
  if (lineMatch?.[1]) location.line = Number(lineMatch[1]);

  const columnMatch = /column\s+(\d+)/i.exec(message);
  if (columnMatch?.[1]) location.column = Number(columnMatch[1]);

  return location;
}

export function parseJson(source: string): Result<unknown> {
  if (source.trim() === "") {
    return err({ kind: "parse", message: "Input masih kosong. Tempel JSON terlebih dahulu." });
  }
  try {
    return ok(JSON.parse(source));
  } catch (cause) {
    const rawMessage = cause instanceof Error ? cause.message : String(cause);
    const location = extractLocation(rawMessage);

    // Buang detail teknis dari pesan utama; lokasi ditampilkan terpisah.
    const friendly = rawMessage
      .replace(/^JSON\.parse: /, "")
      .replace(/\s*\(line \d+ column \d+\)$/, "")
      .replace(/^Unexpected token/, "Token tidak terduga");

    const error: ToolError = { kind: "parse", message: friendly };

    if (location.line !== undefined) {
      error.line = location.line;
      error.column = location.column ?? (location.offset !== undefined
        ? offsetToLineColumn(source, location.offset).column
        : 1);
    } else {
      // Mesin tanpa posisi (mis. V8 modern): pindai sendiri.
      const scanned = location.offset ?? locateErrorOffset(source);
      if (scanned !== null) {
        const { line, column } = offsetToLineColumn(source, scanned);
        error.line = line;
        error.column = column;
      }
    }

    if (error.line !== undefined) {
      error.detail = errorExcerpt(source, error.line, error.column ?? 1);
      error.message = `JSON tidak valid di baris ${error.line}, kolom ${error.column ?? 1}: ${friendly}`;
    } else {
      error.message = `JSON tidak valid: ${friendly}`;
    }

    return err(error);
  }
}

function computeStats(value: unknown): JsonStats {
  let keys = 0;
  let maxDepth = 0;

  const walk = (node: unknown, depth: number): void => {
    if (depth > maxDepth) maxDepth = depth;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const key of Object.keys(node as Record<string, unknown>)) {
        keys += 1;
        walk((node as Record<string, unknown>)[key], depth + 1);
      }
    }
  };

  walk(value, 0);
  return { rootType: rootTypeOf(value), keys, maxDepth };
}

export function rootTypeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

const indentValue = (indent: JsonIndent): string | number =>
  indent === "tab" ? "\t" : indent;

export function formatJson(source: string, indent: JsonIndent = 2): Result<JsonFormatResult> {
  const parsed = parseJson(source);
  if (!parsed.ok) return parsed;
  const text = JSON.stringify(parsed.value, null, indentValue(indent));
  return ok({ text, stats: computeStats(parsed.value) });
}

export function minifyJson(source: string): Result<JsonFormatResult> {
  const parsed = parseJson(source);
  if (!parsed.ok) return parsed;
  return ok({ text: JSON.stringify(parsed.value), stats: computeStats(parsed.value) });
}

export function validateJson(source: string): Result<JsonStats> {
  const parsed = parseJson(source);
  if (!parsed.ok) return parsed;
  return ok(computeStats(parsed.value));
}
