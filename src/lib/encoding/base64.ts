/**
 * Base64 engine — murni, tanpa DOM. UTF-8 aman via TextEncoder/TextDecoder
 * (tersedia di environment modern maupun Node 22 untuk test).
 *
 * Catatan kejujuran: encoding BUKAN enkripsi. Dinyatakan di registry + UI.
 */
import { err, ok, type Result } from "@/types/result";

export type Base64Variant = "standard" | "urlsafe";

export interface Base64Options {
  variant?: Base64Variant;
  /** Bungkus output per 76 karakter (gaya MIME). */
  wrap?: boolean;
}

const WRAP_WIDTH = 76;

function toBase64String(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function fromBase64String(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const applyVariant = (text: string, variant: Base64Variant): string => {
  if (variant === "standard") return text;
  return text.replace(/\+/g, "-").replace(/\//g, "_");
};

const restoreVariant = (text: string, variant: Base64Variant): string => {
  const normalized = text.replace(/\s+/g, "");
  const restored =
    variant === "urlsafe"
      ? normalized.replace(/-/g, "+").replace(/_/g, "/")
      : normalized;
  return restored;
};

const wrapText = (text: string): string => {
  const lines: string[] = [];
  for (let index = 0; index < text.length; index += WRAP_WIDTH) {
    lines.push(text.slice(index, index + WRAP_WIDTH));
  }
  return lines.join("\n");
};

export function encodeBase64(input: string, options: Base64Options = {}): Result<string> {
  const { variant = "standard", wrap = false } = options;
  try {
    const encoded = applyVariant(toBase64String(new TextEncoder().encode(input)), variant);
    return ok(wrap ? wrapText(encoded) : encoded);
  } catch (cause) {
    return err({
      kind: "internal",
      message: `Gagal meng-encode: ${cause instanceof Error ? cause.message : String(cause)}`,
    });
  }
}

export function decodeBase64(source: string, options: Base64Options = {}): Result<string> {
  const { variant = "standard" } = options;
  const compact = source.replace(/\s+/g, "");
  if (compact === "") {
    return err({ kind: "parse", message: "Input masih kosong. Tempel Base64 terlebih dahulu." });
  }

  const candidate = restoreVariant(source, variant);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(candidate)) {
    return err({
      kind: "parse",
      message: "Input bukan Base64 yang valid (mengandung karakter di luar alfabet Base64).",
    });
  }
  if (candidate.length % 4 !== 0) {
    return err({
      kind: "parse",
      message: `Panjang Base64 tidak valid (${candidate.length} karakter; harus kelipatan 4).`,
    });
  }

  try {
    const bytes = fromBase64String(candidate);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return ok(text);
  } catch {
    return err({
      kind: "parse",
      message: "Base64 ter-decode, tetapi hasilnya bukan teks UTF-8 yang valid.",
    });
  }
}
