import type { DiffLine } from "@/lib/diff/text";

const KIND_LABEL: Record<DiffLine["kind"], string> = {
  unchanged: "tidak berubah",
  added: "ditambahkan",
  removed: "dihapus",
  modified: "diubah",
};

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
            {line.leftNumber ?? ""}·{line.rightNumber ?? ""}
          </span>
          <span role="cell">
            <span className="sr-only">{KIND_LABEL[line.kind]}: </span>
            <span aria-hidden="true">
              {line.kind === "added" ? "+" : line.kind === "removed" ? "-" : line.kind === "modified" ? "~" : " "}
            </span>
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
