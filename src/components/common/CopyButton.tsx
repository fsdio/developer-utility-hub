import { useCopy } from "@/hooks/useCopy";
import { Button } from "@/components/common/Button";

interface CopyButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
  /** Tombol rapat tanpa teks label — untuk baris hasil yang padat. */
  compact?: boolean;
  /**
   * Konteks tambahan untuk nama aksesibel, mis. "nilai HEX". Wajib ketika
   * beberapa CopyButton tampil berjajar agar pembaca layar bisa membedakan.
   */
  context?: string;
}

const FEEDBACK: Record<"idle" | "copied" | "fallback" | "failed", string> = {
  idle: "Copy",
  copied: "Tersalin",
  fallback: "Tersalin",
  failed: "Gagal menyalin",
};

export function CopyButton({
  text,
  label = "Copy",
  disabled,
  compact,
  context,
}: CopyButtonProps) {
  const { status, copy } = useCopy();
  const failed = status === "failed";
  return (
    <>
      <Button
        className={compact ? "button--compact" : undefined}
        onClick={() => void copy(text)}
        disabled={disabled ?? text === ""}
        aria-label={
          failed
            ? `Gagal menyalin${context ? ` ${context}` : ""}. Pilih teks lalu tekan Ctrl+C.`
            : `Salin ${context ?? label} ke clipboard`
        }
      >
        {failed ? FEEDBACK.failed : status === "idle" ? label : FEEDBACK[status]}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "idle" ? "" : failed ? "Clipboard ditolak browser" : "Teks tersalin"}
      </span>
    </>
  );
}
