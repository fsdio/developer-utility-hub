interface DiffSummaryProps {
  added: number;
  removed: number;
  modified?: number;
  changedLabel?: string;
  /** Pesan tambahan, mis. ketika kedua dokumen identik. */
  note?: string;
}

/**
 * Ringkasan diff sebagai pill berwarna — pemindaian cepat tanpa membaca teks.
 * Angka tetap ditulis, warna hanya mempercepat; bukan satu-satunya penanda.
 */
export function DiffSummary({
  added,
  removed,
  modified,
  changedLabel = "diubah",
  note,
}: DiffSummaryProps) {
  const noChange = added === 0 && removed === 0 && (modified ?? 0) === 0;

  return (
    <p className="diff-summary" aria-live="polite">
      <span className="diff-stat diff-stat--added">+{added} ditambah</span>
      <span className="diff-stat diff-stat--removed">−{removed} dihapus</span>
      {modified === undefined ? null : (
        <span className="diff-stat diff-stat--modified">~{modified} {changedLabel}</span>
      )}
      {noChange ? <span className="diff-stat diff-stat--none">Tidak ada perbedaan</span> : null}
      {note ? <span className="diff-summary-note">{note}</span> : null}
    </p>
  );
}

export function DiffLegend() {
  return (
    <div className="diff-legend" aria-hidden="true">
      <span className="diff-legend-item">
        <span className="diff-legend-swatch" style={{ background: "var(--added-bg)", borderColor: "var(--added-edge)" }} />
        ditambahkan
      </span>
      <span className="diff-legend-item">
        <span className="diff-legend-swatch" style={{ background: "var(--removed-bg)", borderColor: "var(--removed-edge)" }} />
        dihapus
      </span>
      <span className="diff-legend-item">
        <span className="diff-legend-swatch" style={{ background: "var(--changed-bg)", borderColor: "var(--changed-edge)" }} />
        diubah
      </span>
    </div>
  );
}
