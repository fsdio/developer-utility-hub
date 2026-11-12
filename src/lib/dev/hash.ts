/**
 * Hash engine (SHA-256 / SHA-512) — memakai Web Crypto yang diinjeksi.
 * Engine tetap bebas DOM: `SubtleCrypto` diberikan oleh pemanggil.
 *
 * Catatan kejujuran: hash bukan enkripsi dan tidak dapat dibalik.
 */
import { err, ok, type Result } from "@/types/result";

export const HASH_ALGORITHMS = ["SHA-256", "SHA-512", "SHA-1"] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export interface HashResult {
  algorithm: HashAlgorithm;
  hex: string;
  base64: string;
  bits: number;
}

export interface SubtleLike {
  /** Signature sengaja lebar agar `SubtleCrypto` milik browser dapat langsung dipakai. */
  digest(algorithm: string, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
}

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export async function hashText(
  input: string,
  algorithm: HashAlgorithm,
  subtle: SubtleLike | undefined,
  encoding: { encode: (text: string) => Uint8Array<ArrayBuffer> } = {
    encode: (text) => new TextEncoder().encode(text),
  },
): Promise<Result<HashResult>> {
  if (!subtle) {
    return err({
      kind: "internal",
      message:
        "Web Crypto tidak tersedia. Hash memerlukan konteks aman (HTTPS atau localhost) dan browser modern.",
    });
  }
  try {
    const bytes = encoding.encode(input);
    const digest = await subtle.digest(algorithm, bytes);
    const bits = algorithm === "SHA-512" ? 512 : algorithm === "SHA-256" ? 256 : 160;
    return ok({ algorithm, hex: toHex(digest), base64: toBase64(digest), bits });
  } catch (cause) {
    return err({
      kind: "internal",
      message: `Gagal menghitung hash: ${cause instanceof Error ? cause.message : String(cause)}`,
    });
  }
}
