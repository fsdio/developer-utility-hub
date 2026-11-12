/**
 * JSON Diff struktural — murni, tanpa DOM.
 * Semantik & keluaran: docs/adr/0002-json-diff-semantics.md
 */
import { err, ok, type Result } from "@/types/result";
import { parseJson } from "@/lib/json/format";

export type ChangeKind = "added" | "removed" | "changed";

export interface JsonChange {
  /** JSON Pointer (RFC 6901). Root = "" */
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
  typeChange?: { from: string; to: string };
}

export interface JsonDiffResult {
  changes: JsonChange[];
  added: number;
  removed: number;
  changed: number;
  identical: boolean;
}

export const MAX_DEPTH = 200;

type JsonValue = unknown;

export function jsonTypeOf(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

export function joinPointer(base: string, segment: string | number): string {
  return `${base}/${escapePointerSegment(String(segment))}`;
}

const isPlainObject = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** true bila kedalaman terlampaui (dipakai sebagai sinyal, bukan exception). */
class DepthExceeded extends Error {}

function isDeepEqual(a: JsonValue, b: JsonValue, depth: number): boolean {
  if (depth > MAX_DEPTH) throw new DepthExceeded();
  const ta = jsonTypeOf(a);
  const tb = jsonTypeOf(b);
  if (ta !== tb) return false;

  if (ta === "array") {
    const arrA = a as JsonValue[];
    const arrB = b as JsonValue[];
    if (arrA.length !== arrB.length) return false;
    return arrA.every((item, index) => isDeepEqual(item, arrB[index], depth + 1));
  }

  if (ta === "object") {
    const objA = a as Record<string, JsonValue>;
    const objB = b as Record<string, JsonValue>;
    const keysA = Object.keys(objA);
    if (keysA.length !== Object.keys(objB).length) return false;
    return keysA.every(
      (key) => Object.hasOwn(objB, key) && isDeepEqual(objA[key], objB[key], depth + 1),
    );
  }

  return a === b;
}

function walk(
  a: JsonValue,
  b: JsonValue,
  path: string,
  depth: number,
  out: JsonChange[],
): void {
  if (depth > MAX_DEPTH) throw new DepthExceeded();
  if (isDeepEqual(a, b, depth)) return;

  const typeA = jsonTypeOf(a);
  const typeB = jsonTypeOf(b);

  if (typeA !== typeB) {
    out.push({ path, kind: "changed", before: a, after: b, typeChange: { from: typeA, to: typeB } });
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length);
    for (let index = 0; index < max; index += 1) {
      const childPath = joinPointer(path, index);
      if (index >= a.length) {
        out.push({ path: childPath, kind: "added", after: b[index] });
      } else if (index >= b.length) {
        out.push({ path: childPath, kind: "removed", before: a[index] });
      } else {
        walk(a[index], b[index], childPath, depth + 1, out);
      }
    }
    return;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    for (const key of Object.keys(a)) {
      const childPath = joinPointer(path, key);
      if (!Object.hasOwn(b, key)) {
        out.push({ path: childPath, kind: "removed", before: a[key] });
      } else {
        walk(a[key], b[key], childPath, depth + 1, out);
      }
    }
    for (const key of Object.keys(b)) {
      if (!Object.hasOwn(a, key)) {
        out.push({ path: joinPointer(path, key), kind: "added", after: b[key] });
      }
    }
    return;
  }

  out.push({ path, kind: "changed", before: a, after: b });
}

/** Urutkan change: kedalaman → path leksikografis → jenis (ADR-0002 §5). */
export function sortChanges(changes: JsonChange[]): JsonChange[] {
  const depthOf = (p: string): number => (p === "" ? 0 : p.split("/").length - 1);
  const order: Record<ChangeKind, number> = { removed: 0, added: 1, changed: 2 };
  return [...changes].sort((x, y) => {
    const d = depthOf(x.path) - depthOf(y.path);
    if (d !== 0) return d;
    if (x.path !== y.path) return x.path < y.path ? -1 : 1;
    return order[x.kind] - order[y.kind];
  });
}

export function summarizeChanges(changes: JsonChange[]): Pick<JsonDiffResult, "added" | "removed" | "changed" | "identical"> {
  return {
    added: changes.filter((c) => c.kind === "added").length,
    removed: changes.filter((c) => c.kind === "removed").length,
    changed: changes.filter((c) => c.kind === "changed").length,
    identical: changes.length === 0,
  };
}

/** Bandingkan dua nilai JSON yang sudah di-parse. */
export function diffJsonValues(a: JsonValue, b: JsonValue): Result<JsonDiffResult> {
  const changes: JsonChange[] = [];
  try {
    walk(a, b, "", 0, changes);
  } catch (cause) {
    if (cause instanceof DepthExceeded) {
      return err({
        kind: "depth",
        message: `Dokumen melebihi kedalaman maksimum ${MAX_DEPTH} level.`,
      });
    }
    throw cause;
  }
  const sorted = sortChanges(changes);
  return ok({ changes: sorted, ...summarizeChanges(sorted) });
}

/** Bandingkan dua string JSON; keduanya wajib valid. */
export function diffJson(left: string, right: string): Result<JsonDiffResult> {
  const parsedLeft = parseJson(left);
  if (!parsedLeft.ok) {
    return err({ ...parsedLeft.error, message: `Panel kiri — ${parsedLeft.error.message}` });
  }
  const parsedRight = parseJson(right);
  if (!parsedRight.ok) {
    return err({ ...parsedRight.error, message: `Panel kanan — ${parsedRight.error.message}` });
  }
  return diffJsonValues(parsedLeft.value, parsedRight.value);
}
