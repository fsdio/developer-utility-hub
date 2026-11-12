/** Akses clipboard dengan fallback yang terlihat (UI spec §4). */

export type CopyOutcome = "copied" | "fallback" | "failed";

export async function copyText(text: string): Promise<CopyOutcome> {
  if (text === "") return "failed";

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // jatuh ke fallback di bawah
    }
  }

  if (typeof document === "undefined") return "failed";

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    const succeeded = typeof document.execCommand === "function" && document.execCommand("copy");
    document.body.removeChild(area);
    return succeeded ? "fallback" : "failed";
  } catch {
    return "failed";
  }
}
