import { diffChars } from "diff";
import type { CharSegment, DiffLine, LineKind, TextDiffResult } from "@/lib/diff/text";

/**
 * Satu baris untuk lapisan sorotan di belakang textarea (ADR-0015).
 *
 * `segments` hanya dipakai bila sebagian karakter berubah (`modified`); baris
 * `removed`/`added` disorot utuh karena seluruh barisnya memang berbeda.
 */
export interface OverlayLine {
  kind: LineKind;
  segments?: CharSegment[];
}

export interface DiffOverlay {
  left: OverlayLine[];
  right: OverlayLine[];
}

const UNCHANGED: OverlayLine = { kind: "unchanged" };

/** Segmen karakter sisi kiri: yang hilang ditandai, yang baru dibuang. */
const leftSegments = (before: string, after: string): CharSegment[] =>
  diffChars(before, after).flatMap((change): CharSegment[] => {
    if (change.added) return [];
    if (change.removed) return [{ value: change.value, changed: true }];
    return [{ value: change.value, changed: false }];
  });

/**
 * Ubah hasil `diffText` menjadi dua larik baris berindeks nomor baris, supaya
 * panel Original dan Modified bisa menyorot perbedaannya langsung di dalam
 * textarea — bukan di panel hasil terpisah.
 */
export function buildDiffOverlay(result: TextDiffResult): DiffOverlay {
  const left: OverlayLine[] = [];
  const right: OverlayLine[] = [];

  for (const line of result.lines as DiffLine[]) {
    if (line.kind === "unchanged") {
      if (line.leftNumber !== null) left[line.leftNumber - 1] = UNCHANGED;
      if (line.rightNumber !== null) right[line.rightNumber - 1] = UNCHANGED;
      continue;
    }
    if (line.kind === "removed") {
      if (line.leftNumber !== null) left[line.leftNumber - 1] = { kind: "removed" };
      continue;
    }
    if (line.kind === "added") {
      if (line.rightNumber !== null) right[line.rightNumber - 1] = { kind: "added" };
      continue;
    }
    // modified: baris kiri disorot sebagai dihapus, baris kanan sebagai ditambah,
    // dengan penanda karakter yang berubah di keduanya.
    if (line.leftNumber !== null) {
      left[line.leftNumber - 1] = {
        kind: "modified",
        segments: line.before === undefined ? undefined : leftSegments(line.before, line.text),
      };
    }
    if (line.rightNumber !== null) {
      right[line.rightNumber - 1] = { kind: "modified", segments: line.segments };
    }
  }

  return { left, right };
}
