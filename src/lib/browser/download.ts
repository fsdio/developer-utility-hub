/** Download hasil via Blob; URL selalu di-revoke (PRD §6.0). */

export function downloadText(filename: string, text: string, mime = "text/plain"): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined") return false;
  try {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Revoke setelah tick agar browser sempat memulai unduhan.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function datedFilename(base: string, extension: string, now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${base}-${year}-${month}-${day}.${extension}`;
}
