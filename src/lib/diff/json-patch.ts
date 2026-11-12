/**
 * Konversi daftar JsonChange menjadi JSON Patch (RFC 6902).
 * ADR-0002 §4: hanya `add` / `remove` / `replace`, dan patch bersifat DESKRIPTIF.
 */
import type { JsonChange } from "@/lib/diff/json";

export type PatchOperation = "add" | "remove" | "replace";

export interface PatchEntry {
  op: PatchOperation;
  path: string;
  value?: unknown;
}

export function toJsonPatch(changes: readonly JsonChange[]): PatchEntry[] {
  // Hanya perubahan terdalam yang bermakna: bila sebuah parent dihapus,
  // anak-anaknya tidak perlu operasi terpisah.
  const removedPrefixes = changes
    .filter((change) => change.kind === "removed")
    .map((change) => change.path);

  const isUnderRemovedParent = (path: string): boolean =>
    removedPrefixes.some((prefix) => prefix !== path && path.startsWith(`${prefix}/`));

  const entries: PatchEntry[] = [];
  for (const change of changes) {
    if (isUnderRemovedParent(change.path)) continue;
    switch (change.kind) {
      case "added":
        entries.push({ op: "add", path: change.path, value: change.after });
        break;
      case "removed":
        entries.push({ op: "remove", path: change.path });
        break;
      case "changed":
        entries.push({ op: "replace", path: change.path, value: change.after });
        break;
    }
  }
  return entries;
}

export function patchToText(changes: readonly JsonChange[]): string {
  return JSON.stringify(toJsonPatch(changes), null, 2);
}
