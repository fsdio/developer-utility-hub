import { useCallback, useEffect, useRef, useState } from "react";
import { copyText, type CopyOutcome } from "@/lib/browser/clipboard";

export interface UseCopyResult {
  status: "idle" | CopyOutcome;
  copy: (text: string) => Promise<void>;
}

/** Copy dengan umpan balik 1,5 detik (UI spec §2.9). */
export function useCopy(): UseCopyResult {
  const [status, setStatus] = useState<"idle" | CopyOutcome>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async (text: string) => {
    const outcome = await copyText(text);
    setStatus(outcome);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 1500);
  }, []);

  return { status, copy };
}
