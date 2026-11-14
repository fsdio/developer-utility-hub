/**
 * Text diff engine — murni, tanpa DOM.
 * Memakai `diff` untuk baris & karakter; menyusun model baris yang dipakai
 * `buildDiffOverlay` untuk menyorot kedua form (ADR-0015).
 */
import { diffChars, diffLines } from "diff";

export interface TextDiffOptions {
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
}

export type LineKind = "unchanged" | "added" | "removed" | "modified";

export interface CharSegment {
  value: string;
  changed: boolean;
}

export interface DiffLine {
  kind: LineKind;
  leftNumber: number | null;
  rightNumber: number | null;
  /** Teks yang ditampilkan (untuk `modified`: teks sisi kanan). */
  text: string;
  /** Untuk `modified`: teks sisi kiri. */
  before?: string;
  /** Untuk `modified`: segmen karakter yang berubah. */
  segments?: CharSegment[];
}

export interface TextDiffResult {
  lines: DiffLine[];
  added: number;
  removed: number;
  modified: number;
  unified: string;
  identical: boolean;
}

const normalize = (line: string, options: TextDiffOptions): string => {
  let value = line;
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, " ").trim();
  if (options.ignoreCase) value = value.toLocaleLowerCase();
  return value;
};

const splitLines = (text: string): string[] => (text === "" ? [] : text.split("\n"));

const partValues = (part: { value: string; count?: number }): string[] => {
  const count = part.count ?? 0;
  if (count === 0) return [];
  const raw = part.value.replace(/\n$/, "");
  return raw.split("\n").slice(0, count);
};

export function diffText(
  left: string,
  right: string,
  options: TextDiffOptions = {},
): TextDiffResult {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);

  const parts = diffLines(
    leftLines.map((line) => normalize(line, options)).join("\n"),
    rightLines.map((line) => normalize(line, options)).join("\n"),
  );

  const lines: DiffLine[] = [];
  /** Baris removed yang menunggu konteks berikutnya (lihat aturan pairing). */
  let pendingRemoved: Array<{ number: number; text: string }> = [];
  let leftNumber = 0;
  let rightNumber = 0;
  let added = 0;
  let removed = 0;
  let modified = 0;

  const flushRemoved = (): void => {
    for (const item of pendingRemoved) {
      lines.push({
        kind: "removed",
        leftNumber: item.number,
        rightNumber: null,
        text: item.text,
      });
      removed += 1;
    }
    pendingRemoved = [];
  };

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    const part = parts[partIndex];
    if (!part) continue;
    const values = partValues(part);

    if (part.removed) {
      for (let i = 0; i < values.length; i += 1) {
        leftNumber += 1;
        pendingRemoved.push({
          number: leftNumber,
          text: leftLines[leftNumber - 1] ?? values[i] ?? "",
        });
      }
      continue;
    }

    if (part.added) {
      // Aturan pairing: pasangan hanya dibentuk bila blok added adalah blok
      // TERAKHIR dalam hasil diff, atau jumlah baris removed = added dan blok
      // berikutnya adalah konteks. Selain itu baris diperlakukan add/remove
      // terpisah, agar blok yang benar-benar digeser tidak tampil sebagai "modified".
      const nextPart = parts[partIndex + 1];
      const isLastBlock = nextPart === undefined;
      const sizesMatch = pendingRemoved.length === values.length;
      const nextIsContext = nextPart !== undefined && !nextPart.added && !nextPart.removed;
      const pairUp = sizesMatch && (isLastBlock || nextIsContext);

      if (!pairUp) {
        flushRemoved();
        for (let i = 0; i < values.length; i += 1) {
          rightNumber += 1;
          lines.push({
            kind: "added",
            leftNumber: null,
            rightNumber,
            text: rightLines[rightNumber - 1] ?? values[i] ?? "",
          });
          added += 1;
        }
        continue;
      }

      for (let i = 0; i < values.length; i += 1) {
        rightNumber += 1;
        const rightText = rightLines[rightNumber - 1] ?? values[i] ?? "";
        const partner = pendingRemoved.shift();
        if (!partner) {
          lines.push({ kind: "added", leftNumber: null, rightNumber, text: rightText });
          added += 1;
          continue;
        }
        // Pasangan yang isinya sama secara normalisasi bukan "modified":
        // tampilkan sebagai konteks agar tidak menyesatkan.
        if (normalize(partner.text, options) === normalize(rightText, options)) {
          lines.push({ kind: "unchanged", leftNumber: partner.number, rightNumber, text: rightText });
          continue;
        }

        const segments = diffChars(partner.text, rightText).flatMap((change) => {
          if (change.removed) return [];
          return [{ value: change.value, changed: Boolean(change.added) }];
        });
        lines.push({
          kind: "modified",
          leftNumber: partner.number,
          rightNumber,
          text: rightText,
          before: partner.text,
          segments,
        });
        modified += 1;
      }
      continue;
    }

    flushRemoved();
    for (let i = 0; i < values.length; i += 1) {
      leftNumber += 1;
      rightNumber += 1;
      lines.push({
        kind: "unchanged",
        leftNumber,
        rightNumber,
        text: leftLines[leftNumber - 1] ?? values[i] ?? "",
      });
    }
  }

  flushRemoved();

  const unified = lines
    .map((line) => {
      const sign = line.kind === "added" ? "+" : line.kind === "removed" ? "-" : line.kind === "modified" ? "~" : " ";
      return `${sign}${line.text}`;
    })
    .join("\n");

  return { lines, added, removed, modified, unified, identical: left === right };
}

export function summarize(result: TextDiffResult): string {
  return `+${result.added} · -${result.removed} · ~${result.modified}`;
}
