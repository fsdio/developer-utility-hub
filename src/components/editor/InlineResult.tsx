import type { ReactNode } from "react";

interface InlineResultProps {
  /** Judul strip, mis. "Hasil" atau "Error". */
  label: string;
  tone?: "default" | "error" | "success";
  /** Aksi di sisi kanan strip, mis. tombol salin. */
  actions?: ReactNode;
  /** Baris ringkas di kiri strip, mis. "+2 −1 ~1". */
  meta?: ReactNode;
  children: ReactNode;
}

/**
 * Strip hasil yang menempel di dalam panel input (ADR-0012).
 *
 * Alasan: pengguna mengetik di panel atas lalu harus menggulir ke bawah untuk
 * melihat hasil. Dengan strip di dalam panel, input dan hasil berada dalam satu
 * blok pandang — tidak ada perpindahan mata ke bagian lain halaman.
 */
export function InlineResult({ label, tone = "default", actions, meta, children }: InlineResultProps) {
  return (
    <section className={`inline-result inline-result--${tone}`} aria-label={label}>
      <header className="inline-result-head">
        <span className="inline-result-label">{label}</span>
        {meta ? <span className="inline-result-meta">{meta}</span> : null}
        {actions ? <span className="inline-result-actions">{actions}</span> : null}
      </header>
      <div className="inline-result-body">{children}</div>
    </section>
  );
}
