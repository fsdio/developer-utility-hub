import type { DiffLine } from "@/lib/diff/text";

const KIND_LABEL: Record<DiffLine["kind"], string> = {
  unchanged: "tidak berubah",
  added: "ditambahkan",
  removed: "dihapus",
  modified: "diubah",
};

const SIGN: Record<DiffLine["kind"], string> = {
  unchanged: " ",
  added: "+",
  removed: "−",
  modified: "~",
};

/**
 * Diff bergaya `git diff` (docs/ui-specification.md §5).
 * Warna tidak pernah menjadi satu-satunya penanda: setiap baris juga punya
 * tombol +/−/~ dan teks tersembunyi untuk pembaca layar.
 */
interface DiffViewProps {
  lines: DiffLine[];
}

export function DiffView({ lines }: DiffViewProps) {
  return (
    <div className="diff-view" role="table" aria-label="Hasil perbandingan" tabIndex={0}>
      {lines.map((line, index) => (
        <div
          key={`${line.kind}-${index}`}
          role="row"
          className={`diff-row diff-row--${line.kind}`}
        >
          <span className="diff-gutter" aria-hidden="true">
            {line.leftNumber ?? ""}
          </span>
          <span className="diff-gutter" aria-hidden="true">
            {line.rightNumber ?? ""}
          </span>
          <span className="diff-sign" aria-hidden="true">
            {SIGN[line.kind]}
          </span>
          <span role="cell" className="diff-text">
            <span className="sr-only">{KIND_LABEL[line.kind]}: </span>
            {line.kind === "modified" && line.segments ? (
              line.segments.map((segment, segmentIndex) =>
                segment.changed ? (
                  <mark key={segmentIndex}>{segment.value}</mark>
                ) : (
                  <span key={segmentIndex}>{segment.value}</span>
                ),
              )
            ) : (
              line.text
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
