import { useId, useLayoutEffect, useRef, type CSSProperties, type ChangeEvent } from "react";
import type { OverlayLine } from "@/lib/diff/overlay";

interface CodeAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  spellCheck?: boolean;
  hint?: string;
  describedBy?: string;
  error?: boolean;
  maxLength?: number;
  rows?: number;
  /**
   * Sorotan perbedaan per baris (ADR-0015). Bila diberikan, area teks
   * menampilkan diff **langsung di dalam form**: baris dihapus merah, ditambah
   * hijau, diubah kuning dengan penanda karakter yang berubah.
   *
   * Larik diindeks nomor baris - 1; indeks tanpa entri berarti baris tersebut
   * tidak ada di sisi itu (baris baru/kosong).
   */
  overlay?: OverlayLine[];
  /** Tampilkan nomor baris di kiri area (dipakai bersama `overlay`). */
  gutter?: boolean;
  /** Area tumbuh mengikuti jumlah baris, bukan tinggi tetap. */
  autoGrow?: boolean;
}

/**
 * Area teks utama tool.
 *
 * Label tidak dirender terlihat: judul panel di atasnya sudah menyebut isinya,
 * dan placeholder menjelaskan contoh nyata. Label tetap ada untuk pembaca layar
 * lewat `sr-only`, `hint` juga `sr-only` — tidak ada teks yang mengapit input
 * (ADR-0011). Area mengisi seluruh badan panel agar tidak ada ruang terbuang.
 */
export function CodeArea({
  label,
  value,
  onChange,
  placeholder,
  spellCheck = false,
  hint,
  describedBy,
  error = false,
  rows = 12,
  overlay,
  gutter = false,
  autoGrow = false,
}: CodeAreaProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const layerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const overlaid = overlay !== undefined;

  // Lapisan sorotan harus menggulir persis seperti textarea di atasnya.
  useLayoutEffect(() => {
    if (!overlaid) return;
    const area = areaRef.current;
    const layer = layerRef.current;
    if (!area || !layer) return;
    const sync = (): void => {
      layer.scrollTop = area.scrollTop;
      layer.scrollLeft = area.scrollLeft;
    };
    sync();
    area.addEventListener("scroll", sync, { passive: true });
    return () => area.removeEventListener("scroll", sync);
  }, [overlaid, value]);

  const lineCount = value === "" ? 1 : value.split("\n").length;
  const height = autoGrow ? Math.max(rows, lineCount) : rows;
  const gutterWidth = String(Math.max(1, lineCount)).length;

  const className = [
    "code-area",
    overlaid ? "code-area--overlaid" : "",
    gutter ? "code-area--gutter" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const area = (
    <textarea
      ref={areaRef}
      id={id}
      className={className}
      value={value}
      rows={height}
      spellCheck={spellCheck}
      autoCapitalize="off"
      autoCorrect="off"
      placeholder={placeholder}
      aria-invalid={error || undefined}
      aria-describedby={
        [hint ? hintId : "", describedBy ?? ""].filter(Boolean).join(" ") || undefined
      }
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
    />
  );

  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      {overlaid ? (
        <div
          className="code-area-stack"
          style={{ "--gutter-digits": gutterWidth } as CSSProperties}
        >
          <div
            className="code-area-layer"
            aria-hidden="true"
            ref={layerRef}
            data-testid={`overlay-${label}`}
          >
            {overlay.map((line, index) => (
              <div key={index} className={`diff-line diff-line--${line.kind}`}>
                {gutter ? (
                  <span className="diff-line-no">{index + 1}</span>
                ) : null}
                <span className="diff-line-text">
                  {line.segments
                    ? line.segments.map((segment, segmentIndex) =>
                        segment.changed ? (
                          <mark key={segmentIndex}>{segment.value}</mark>
                        ) : (
                          <span key={segmentIndex}>{segment.value}</span>
                        ),
                      )
                    : null}
                </span>
              </div>
            ))}
          </div>
          {area}
        </div>
      ) : (
        area
      )}
      {hint ? (
        <span id={hintId} className="sr-only">
          {hint}
        </span>
      ) : null}
    </>
  );
}
