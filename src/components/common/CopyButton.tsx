import { useCopy } from "@/hooks/useCopy";
import { Button } from "@/components/common/Button";

interface CopyButtonProps {
  text: string;
  label?: string;
  disabled?: boolean;
}

const FEEDBACK: Record<"idle" | "copied" | "fallback" | "failed", string> = {
  idle: "Copy",
  copied: "Tersalin",
  fallback: "Tersalin",
  failed: "Gagal menyalin",
};

export function CopyButton({ text, label = "Copy", disabled }: CopyButtonProps) {
  const { status, copy } = useCopy();
  const failed = status === "failed";
  return (
    <>
      <Button
        onClick={() => void copy(text)}
        disabled={disabled ?? text === ""}
        aria-label={failed ? "Gagal menyalin. Pilih teks lalu tekan Ctrl+C." : `${label} ke clipboard`}
      >
        {failed ? FEEDBACK.failed : status === "idle" ? label : FEEDBACK[status]}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {status === "idle" ? "" : failed ? "Clipboard ditolak browser" : "Teks tersalin"}
      </span>
    </>
  );
}
