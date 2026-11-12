/**
 * JWT decoder — decode saja, TANPA verifikasi signature.
 * Aturan mengikat: docs/adr/0009-jwt-decoder-decode-only.md
 *
 * Modul ini sengaja tidak menyediakan (dan tidak akan menyediakan) parameter
 * key/secret. Tidak adanya API verifikasi adalah jaminan arsitektural bahwa tool
 * ini tidak bisa dipakai untuk mengklaim sebuah token terverifikasi.
 */
import { err, ok, type Result } from "@/types/result";

export type JwtSegment = "header" | "payload" | "signature";

export interface JwtClaimStatus {
  /** Nama claim waktu yang ditemukan. */
  claim: "exp" | "nbf" | "iat";
  /** Nilai epoch (detik). */
  epoch: number;
  /** Representasi ISO agar mudah dibaca. */
  iso: string;
  /** Perbandingan terhadap jam perangkat — BUKAN validasi token. */
  state: "expired" | "not-yet-valid" | "within-window" | "issued";
}

export interface DecodedJwt {
  algorithm: string | null;
  /** true bila header menetapkan alg "none" (tanpa signature). */
  unsigned: boolean;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** Signature sebagai string mentah; TIDAK pernah diperiksa. */
  signature: string;
  /** Selalu false. Ada sebagai dokumentasi eksplisit di tipe. */
  signatureVerified: false;
  claims: JwtClaimStatus[];
  /** true bila token punya 5 bagian (JWE) — tidak didukung. */
  encrypted: false;
}

const MAX_TOKEN_LENGTH = 64 * 1024;

/** Base64URL → UTF-8 string. Mengembalikan null bila bukan Base64URL valid. */
function base64UrlToText(segment: string): string | null {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) return null;
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    // fatal: true agar payload biner ditolak, bukan ditebak.
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function describeNumericDate(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function buildClaims(
  payload: Record<string, unknown>,
  nowSeconds: number,
): JwtClaimStatus[] {
  const claims: JwtClaimStatus[] = [];

  const push = (claim: JwtClaimStatus["claim"], raw: unknown): void => {
    const epoch = describeNumericDate(raw);
    if (epoch === null) return;
    const iso = new Date(epoch * 1000).toISOString();

    let state: JwtClaimStatus["state"];
    if (claim === "exp") {
      state = epoch * 1000 <= nowSeconds * 1000 ? "expired" : "within-window";
    } else if (claim === "nbf") {
      state = epoch > nowSeconds ? "not-yet-valid" : "within-window";
    } else {
      state = "issued";
    }

    claims.push({ claim, epoch, iso, state });
  };

  push("iat", payload.iat);
  push("nbf", payload.nbf);
  push("exp", payload.exp);

  return claims;
}

export function decodeJwt(source: string, nowSeconds = Date.now() / 1000): Result<DecodedJwt> {
  const token = source.trim();
  if (token === "") {
    return err({ kind: "parse", message: "Input masih kosong. Tempel token JWT terlebih dahulu." });
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    return err({
      kind: "limit",
      message: `Token melebihi ${MAX_TOKEN_LENGTH.toLocaleString("id-ID")} karakter. Periksa kembali input Anda.`,
    });
  }

  const parts = token.split(".");
  if (parts.length === 5) {
    return err({
      kind: "parse",
      message:
        "Token ini tampak sebagai JWE (5 bagian, terenkripsi). Tool ini hanya men-decode JWS (3 bagian) dan tidak mendekripsi apa pun.",
    });
  }
  if (parts.length !== 3) {
    return err({
      kind: "parse",
      message: `JWT harus memiliki 3 bagian yang dipisah titik (header.payload.signature); ditemukan ${parts.length} bagian.`,
    });
  }

  const [headerSegment = "", payloadSegment = "", signatureSegment = ""] = parts;

  const headerText = base64UrlToText(headerSegment);
  if (headerText === null) {
    return err({ kind: "parse", message: "Bagian header bukan Base64URL yang valid." });
  }
  const header = parseJsonObject(headerText);
  if (header === null) {
    return err({ kind: "parse", message: "Header token bukan objek JSON yang valid." });
  }

  const payloadText = base64UrlToText(payloadSegment);
  if (payloadText === null) {
    return err({ kind: "parse", message: "Bagian payload bukan Base64URL yang valid." });
  }
  const payload = parseJsonObject(payloadText);
  if (payload === null) {
    return err({ kind: "parse", message: "Payload token bukan objek JSON yang valid." });
  }

  // Signature hanya ditampilkan, tidak diverifikasi (ADR-0009 §1).
  if (!/^[A-Za-z0-9_-]*$/.test(signatureSegment)) {
    return err({ kind: "parse", message: "Bagian signature bukan Base64URL yang valid." });
  }

  const algorithm = typeof header.alg === "string" ? header.alg : null;

  return ok({
    algorithm,
    unsigned: algorithm !== null && algorithm.toLowerCase() === "none",
    header,
    payload,
    signature: signatureSegment,
    signatureVerified: false,
    claims: buildClaims(payload, nowSeconds),
    encrypted: false,
  });
}

/** Label status claim — tidak pernah memakai kata "valid". */
export const CLAIM_STATE_LABELS: Record<JwtClaimStatus["state"], string> = {
  expired: "kedaluwarsa (menurut jam perangkat)",
  "not-yet-valid": "belum berlaku (menurut jam perangkat)",
  "within-window": "dalam rentang waktu (tidak diverifikasi)",
  issued: "waktu terbit",
};
