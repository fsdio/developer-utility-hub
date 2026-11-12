/**
 * URL encode/decode — murni, tanpa DOM.
 */
import { err, ok, type Result } from "@/types/result";

export type UrlMode = "component" | "form";

export interface UrlDecodeOptions {
  mode?: UrlMode;
  /** Ubah `+` menjadi spasi sebelum decode (perilaku application/x-www-form-urlencoded). */
  plusAsSpace?: boolean;
}

export function encodeUrl(input: string, mode: UrlMode = "component"): Result<string> {
  try {
    if (mode === "component") return ok(encodeURIComponent(input));
    // Mode form: encodeURIComponent lalu spasi menjadi '+' sesuai form encoding.
    return ok(encodeURIComponent(input).replace(/%20/g, "+"));
  } catch (cause) {
    return err({
      kind: "parse",
      message: `Tidak dapat meng-encode: ${cause instanceof Error ? cause.message : String(cause)}`,
    });
  }
}

export function decodeUrl(source: string, options: UrlDecodeOptions = {}): Result<string> {
  const { plusAsSpace = false } = options;
  const prepared = plusAsSpace ? source.replace(/\+/g, " ") : source;
  try {
    return ok(decodeURIComponent(prepared));
  } catch {
    const bad = /%(?![0-9A-Fa-f]{2})/.exec(prepared);
    return err({
      kind: "parse",
      message: bad
        ? `Urutan escape tidak lengkap di posisi ${bad.index + 1} — "%" harus diikuti dua digit heksadesimal.`
        : "Tidak dapat men-decode: input berisi urutan escape yang tidak valid.",
    });
  }
}
