/**
 * Alat bantu autentikasi modern — murni, tanpa DOM, tanpa jaringan.
 *
 * Mencakup tiga hal yang sering dipakai saat integrasi komersial:
 * 1. **JWT**: decode + **verifikasi signature** dengan kunci yang ditempel
 *    pengguna (HMAC, RSA, RSA-PSS, ECDSA, EdDSA) dan pemeriksaan klaim
 * 2. **Basic Auth**: header `Authorization: Basic` ⇄ kredensial.
 * 3. **API key / token acak**: generate, dan hitung digest untuk verifikasi.
 *
 * Aturan mengikat (ADR-0009 tetap berlaku untuk tool JWT Decoder):
 * verifikasi hanya dengan kunci yang diberikan pengguna di sesi ini; tidak ada
 * JWKS, tidak ada `fetch`, dan tidak ada klaim "token ini asli dari penerbit".
 */
import { err, ok, type Result } from "@/types/result";
import { hashText, type SubtleLike } from "@/lib/dev/hash";

/* ────────────────────────── JWT: decode + verifikasi ───────────────────── */

export interface JwtParts {
  headerSegment: string;
  payloadSegment: string;
  signatureSegment: string;
  signingInput: string;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  algorithm: string | null;
  /** `alg: none` — token tanpa signature. */
  unsigned: boolean;
}

const MAX_TOKEN_LENGTH: number = 64 * 1024;

const base64UrlDecodeToBytes = (segment: string): Uint8Array | null => {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) return null;
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
};

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const parseJsonObject = (text: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

/** Memecah dan men-decode token tanpa memeriksa apa pun. */
export function readJwt(source: string): Result<JwtParts> {
  const token = source.trim();
  if (token === "") {
    return err({ kind: "parse", message: "Input masih kosong. Tempel token JWT terlebih dahulu." });
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    return err({ kind: "limit", message: `Token melebihi ${MAX_TOKEN_LENGTH.toLocaleString("id-ID")} karakter.` });
  }
  const parts = token.split(".");
  if (parts.length === 5) {
    return err({
      kind: "parse",
      message: "Token ini JWE (5 bagian, terenkripsi). Tool ini tidak mendekripsi apa pun.",
    });
  }
  if (parts.length !== 3) {
    return err({
      kind: "parse",
      message: `JWT harus 3 bagian dipisah titik (header.payload.signature); ditemukan ${parts.length}.`,
    });
  }
  const [headerSegment = "", payloadSegment = "", signatureSegment = ""] = parts;
  const headerBytes = base64UrlDecodeToBytes(headerSegment);
  const payloadBytes = base64UrlDecodeToBytes(payloadSegment);
  if (!headerBytes) return err({ kind: "parse", message: "Bagian header bukan Base64URL yang valid." });
  if (!payloadBytes) return err({ kind: "parse", message: "Bagian payload bukan Base64URL yang valid." });

  let headerText: string;
  let payloadText: string;
  try {
    headerText = new TextDecoder("utf-8", { fatal: true }).decode(headerBytes);
    payloadText = new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes);
  } catch {
    return err({ kind: "parse", message: "Header atau payload bukan teks UTF-8 yang valid." });
  }

  const header = parseJsonObject(headerText);
  const payload = parseJsonObject(payloadText);
  if (!header) return err({ kind: "parse", message: "Header token bukan objek JSON yang valid." });
  if (!payload) return err({ kind: "parse", message: "Payload token bukan objek JSON yang valid." });
  if (!/^[A-Za-z0-9_-]*$/.test(signatureSegment)) {
    return err({ kind: "parse", message: "Bagian signature bukan Base64URL yang valid." });
  }

  const algorithm = typeof header.alg === "string" ? header.alg : null;
  return ok({
    headerSegment,
    payloadSegment,
    signatureSegment,
    signingInput: `${headerSegment}.${payloadSegment}`,
    header,
    payload,
    algorithm,
    unsigned: algorithm === null || algorithm.toLowerCase() === "none",
  });
}

/** Algoritma yang didukung beserta keluarga kuncinya. */
export type JwtAlgorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "PS256"
  | "PS384"
  | "PS512"
  | "ES256"
  | "ES384"
  | "ES512"
  | "EdDSA";

interface AlgorithmSpec {
  family: "hmac" | "rsa" | "rsa-pss" | "ecdsa" | "eddsa";
  hash: "SHA-256" | "SHA-384" | "SHA-512";
  /** Panjang signature yang diharapkan (byte); ECDSA dipakai untuk validasi bentuk. */
  signatureBytes?: number;
  label: string;
}

const ALGORITHMS: Record<JwtAlgorithm, AlgorithmSpec> = {
  HS256: { family: "hmac", hash: "SHA-256", label: "HMAC + SHA-256 (shared secret)" },
  HS384: { family: "hmac", hash: "SHA-384", label: "HMAC + SHA-384 (shared secret)" },
  HS512: { family: "hmac", hash: "SHA-512", label: "HMAC + SHA-512 (shared secret)" },
  RS256: { family: "rsa", hash: "SHA-256", label: "RSA PKCS#1 v1.5 + SHA-256 (public key)" },
  RS384: { family: "rsa", hash: "SHA-384", label: "RSA PKCS#1 v1.5 + SHA-384 (public key)" },
  RS512: { family: "rsa", hash: "SHA-512", label: "RSA PKCS#1 v1.5 + SHA-512 (public key)" },
  PS256: { family: "rsa-pss", hash: "SHA-256", label: "RSA-PSS + SHA-256 (public key)" },
  PS384: { family: "rsa-pss", hash: "SHA-384", label: "RSA-PSS + SHA-384 (public key)" },
  PS512: { family: "rsa-pss", hash: "SHA-512", label: "RSA-PSS + SHA-512 (public key)" },
  ES256: { family: "ecdsa", hash: "SHA-256", signatureBytes: 64, label: "ECDSA P-256 + SHA-256" },
  ES384: { family: "ecdsa", hash: "SHA-384", signatureBytes: 96, label: "ECDSA P-384 + SHA-384" },
  ES512: { family: "ecdsa", hash: "SHA-512", signatureBytes: 132, label: "ECDSA P-521 + SHA-512" },
  EdDSA: { family: "eddsa", hash: "SHA-512", label: "Ed25519" },
};

export const JWT_ALGORITHMS = ALGORITHMS;
export const isJwtAlgorithm = (value: string): value is JwtAlgorithm => value in ALGORITHMS;

/* ────────────────────────────── Pemakaian kunci ─────────────────────────── */

const PEM_BLOCK = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/;

/** Daur ulang kunci per string agar verifikasi berulang tidak mem-parse ulang. */
const keyCache = new Map<string, Promise<CryptoKey>>();

const pemToDer = (pem: string): ArrayBuffer | null => {
  const match = PEM_BLOCK.exec(pem);
  const body = match ? match[2] : pem;
  const cleaned = (body ?? "").replace(/\s+/g, "");
  if (cleaned === "") return null;
  try {
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return bytes.buffer;
  } catch {
    return null;
  }
};

const importKey = (material: string, algorithm: JwtAlgorithm, subtle: SubtleCrypto): Promise<CryptoKey> => {
  const cacheKey = `${algorithm}\u0000${material}`;
  const cached = keyCache.get(cacheKey);
  if (cached) return cached;

  const spec = ALGORITHMS[algorithm];
  const promise = (async (): Promise<CryptoKey> => {
    if (spec.family === "hmac") {
      // Secret HMAC dipakai apa adanya sebagai byte UTF-8, sama seperti server
      // yang menyimpan `JWT_SECRET` sebagai teks biasa.
      const raw = new TextEncoder().encode(material);
      return subtle.importKey("raw", raw, { name: "HMAC", hash: spec.hash }, false, ["verify"]);
    }

    const der = pemToDer(material);
    if (!der) throw new Error("Kunci publik bukan PEM Base64 yang valid.");
    const pemType = PEM_BLOCK.exec(material)?.[1] ?? "";
    if (spec.family === "rsa" || spec.family === "rsa-pss") {
      if (pemType.includes("PRIVATE")) {
        throw new Error("Ini kunci privat. Untuk verifikasi, tempel kunci publiknya saja.");
      }
      return subtle.importKey(
        "spki",
        der,
        { name: spec.family === "rsa" ? "RSASSA-PKCS1-v1_5" : "RSA-PSS", hash: spec.hash },
        false,
        ["verify"],
      );
    }
    if (spec.family === "ecdsa") {
      return subtle.importKey("spki", der, { name: "ECDSA", namedCurve: curveFor(algorithm) }, false, ["verify"]);
    }
    return subtle.importKey("spki", der, { name: "Ed25519" }, false, ["verify"]);
  })();

  keyCache.set(cacheKey, promise);
  // Jangan simpan kegagalan: pengguna mungkin memperbaiki kuncinya.
  promise.catch(() => keyCache.delete(cacheKey));
  return promise;
};

const curveFor = (algorithm: JwtAlgorithm): string =>
  algorithm === "ES256" ? "P-256" : algorithm === "ES384" ? "P-384" : "P-521";

/** ECDSA JWS memakai r||s mentah; WebCrypto menerima bentuk itu untuk P-256/384/521. */
const verifyParams = (algorithm: JwtAlgorithm): AlgorithmIdentifier | RsaPssParams | EcdsaParams => {
  const spec = ALGORITHMS[algorithm];
  if (spec.family === "hmac") return { name: "HMAC" };
  if (spec.family === "rsa") return { name: "RSASSA-PKCS1-v1_5" };
  if (spec.family === "rsa-pss") return { name: "RSA-PSS", saltLength: hashLength(spec.hash) };
  if (spec.family === "ecdsa") return { name: "ECDSA", hash: spec.hash };
  return { name: "Ed25519" };
};

const hashLength = (hash: AlgorithmSpec["hash"]): number =>
  hash === "SHA-256" ? 32 : hash === "SHA-384" ? 48 : 64;

export type SignatureVerdict = "valid" | "invalid" | "unverified" | "wrong-algorithm" | "error";

export interface SignatureCheck {
  verdict: SignatureVerdict;
  /** Penjelasan untuk manusia. */
  message: string;
  /** Algoritma di header vs yang dipakai kunci. */
  algorithmInToken: string | null;
  algorithmUsed: JwtAlgorithm | null;
}

/** Algoritma mana yang kompatibel dengan kunci yang ditempel. */
export const compatibleAlgorithms = (tokenAlg: string | null, chosen: JwtAlgorithm): boolean =>
  tokenAlg === null || tokenAlg === chosen;

/**
 * Memverifikasi signature token dengan kunci yang diberikan pengguna.
 *
 * Yang **tidak** dilakukan: mengambil JWKS, mempercayai penerbit, atau menyimpulkan
 * token "asli". Fungsi ini hanya menjawab: apakah signature cocok dengan kunci ini.
 */
export async function verifyJwtSignature(
  parts: JwtParts,
  options: { algorithm: JwtAlgorithm; key: string; subtle?: SubtleCrypto },
): Promise<SignatureCheck> {
  const algorithmInToken = parts.algorithm;
  const { algorithm, key } = options;
  const subtle = options.subtle ?? (typeof crypto !== "undefined" ? crypto.subtle : undefined);

  if (parts.unsigned) {
    return {
      verdict: "unverified",
      message: "Token tidak memiliki signature (alg: none). Tidak ada yang bisa diverifikasi.",
      algorithmInToken,
      algorithmUsed: null,
    };
  }

  if (!compatibleAlgorithms(algorithmInToken, algorithm)) {
    return {
      verdict: "wrong-algorithm",
      message: `Header token memakai ${algorithmInToken}, tetapi kunci yang dipilih untuk ${algorithm}. Pilih algoritma yang sesuai atau periksa tokennya.`,
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  }

  if (!subtle) {
    return {
      verdict: "error",
      message: "Web Crypto tidak tersedia (butuh HTTPS atau localhost).",
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  }
  if (key.trim() === "") {
    return {
      verdict: "error",
      message: "Tempel kunci terlebih dahulu. Kunci tidak pernah dikirim ke mana pun.",
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  }

  const signature = base64UrlDecodeToBytes(parts.signatureSegment);
  if (!signature) {
    return { verdict: "error", message: "Signature bukan Base64URL yang valid.", algorithmInToken, algorithmUsed: algorithm };
  }

  const spec = ALGORITHMS[algorithm];
  if (spec.signatureBytes !== undefined && signature.length !== spec.signatureBytes) {
    return {
      verdict: "invalid",
      message: `Panjang signature ${signature.length} byte, seharusnya ${spec.signatureBytes} byte untuk ${algorithm}.`,
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  }

  try {
    const cryptoKey = await importKey(key, algorithm, subtle);
    const data = new TextEncoder().encode(parts.signingInput);
    const valid = await subtle.verify(
      verifyParams(algorithm),
      cryptoKey,
      signature as BufferSource,
      data as BufferSource,
    );
    return {
      verdict: valid ? "valid" : "invalid",
      message: valid
        ? "Signature cocok dengan kunci ini. Ini membuktikan token ditandatangani kunci tersebut, bukan bahwa penerbitnya tepercaya."
        : "Signature tidak cocok dengan kunci ini. Token diubah setelah ditandatangani, atau kuncinya bukan pasangan yang benar.",
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  } catch (cause) {
    return {
      verdict: "error",
      message: `Verifikasi gagal: ${cause instanceof Error ? cause.message : String(cause)}.`,
      algorithmInToken,
      algorithmUsed: algorithm,
    };
  }
}

/* ───────────────────────────── Pemeriksaan klaim ────────────────────────── */

export interface ClaimCheck {
  claim: string;
  /** Nilai yang dibaca dari token, sudah diformat. */
  value: string;
  state: "ok" | "warn" | "fail" | "gap";
  note: string;
}

export interface ClaimAuditOptions {
  nowSeconds?: number;
  /** Detik toleransi untuk exp/nbf (clock skew). */
  clockToleranceSeconds?: number;
  expectedIssuer?: string;
  expectedAudience?: string;
}

const formatEpoch = (epoch: number): string => {
  const iso = new Date(epoch * 1000).toISOString();
  return `${iso} (${epoch})`;
};

/**
 * Audit klaim standar. Selalu jujur soal batasnya: `aud`/`iss` hanya dicocokkan
 * dengan nilai yang diketik pengguna, dan `exp` dibandingkan dengan jam perangkat.
 */
export function auditClaims(payload: Record<string, unknown>, options: ClaimAuditOptions = {}): ClaimCheck[] {
  const now = options.nowSeconds ?? Date.now() / 1000;
  const tolerance = options.clockToleranceSeconds ?? 0;
  const checks: ClaimCheck[] = [];

  const numeric = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  const exp = numeric(payload.exp);
  if (exp === null) {
    checks.push({ claim: "exp", value: "tidak ada", state: "gap", note: "Token tanpa masa berlaku tidak akan pernah kedaluwarsa." });
  } else if (exp + tolerance <= now) {
    checks.push({ claim: "exp", value: formatEpoch(exp), state: "fail", note: "Sudah kedaluwarsa menurut jam perangkat." });
  } else {
    checks.push({
      claim: "exp",
      value: formatEpoch(exp),
      state: "ok",
      note: `Masih berlaku ${Math.round((exp - now) / 60).toLocaleString("id-ID")} menit lagi.`,
    });
  }

  const nbf = numeric(payload.nbf);
  if (nbf !== null) {
    if (nbf - tolerance > now) {
      checks.push({ claim: "nbf", value: formatEpoch(nbf), state: "fail", note: "Belum berlaku menurut jam perangkat." });
    } else {
      checks.push({ claim: "nbf", value: formatEpoch(nbf), state: "ok", note: "Sudah melewati waktu mulai berlaku." });
    }
  }

  const iat = numeric(payload.iat);
  if (iat !== null) {
    const ageMinutes = Math.round((now - iat) / 60);
    checks.push({
      claim: "iat",
      value: formatEpoch(iat),
      state: ageMinutes > 24 * 60 ? "warn" : "ok",
      note: ageMinutes >= 0 ? `Diterbitkan ${ageMinutes.toLocaleString("id-ID")} menit lalu.` : "iat ada di masa depan.",
    });
  }

  const iss = typeof payload.iss === "string" ? payload.iss : null;
  if (options.expectedIssuer) {
    checks.push({
      claim: "iss",
      value: iss ?? "tidak ada",
      state: iss === options.expectedIssuer ? "ok" : "fail",
      note:
        iss === options.expectedIssuer
          ? "Cocok dengan issuer yang kamu harapkan."
          : `Tidak sama dengan issuer yang diharapkan (${options.expectedIssuer}).`,
    });
  } else if (iss !== null) {
    checks.push({ claim: "iss", value: iss, state: "warn", note: "Belum dibandingkan — isi issuer yang diharapkan untuk memeriksa." });
  }

  const aud = payload.aud;
  const audiences = Array.isArray(aud)
    ? aud.filter((item): item is string => typeof item === "string")
    : typeof aud === "string"
      ? [aud]
      : [];
  if (options.expectedAudience) {
    checks.push({
      claim: "aud",
      value: audiences.join(", ") || "tidak ada",
      state: audiences.includes(options.expectedAudience) ? "ok" : "fail",
      note: audiences.includes(options.expectedAudience)
        ? "Audience yang kamu harapkan ada di token."
        : `Audience yang diharapkan (${options.expectedAudience}) tidak ada.`,
    });
  } else if (audiences.length > 0) {
    checks.push({ claim: "aud", value: audiences.join(", "), state: "warn", note: "Belum dibandingkan — isi audience yang diharapkan." });
  }

  const alg = typeof payload.alg === "string" ? payload.alg : null;
  if (alg !== null) {
    checks.push({ claim: "alg (di payload)", value: alg, state: "warn", note: "Alg hanya bermakna di header; salinan di payload tidak dipakai library." });
  }

  return checks;
}

/* ──────────────────────────── Basic Auth ───────────────────────────────── */

export interface BasicCredentials {
  username: string;
  password: string;
}

/** `user:pass` → header `Basic …` (UTF-8 aman). */
export function encodeBasicAuth(credentials: BasicCredentials): Result<string> {
  const { username, password } = credentials;
  if (username === "" && password === "") {
    return err({ kind: "parse", message: "Isi username/password, atau tempel header Authorization." });
  }
  if (username.includes(":")) {
    return err({ kind: "parse", message: "Username tidak boleh mengandung titik dua (:)." });
  }
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return ok(`Basic ${btoa(binary)}`);
}

/** Membaca header `Authorization: Basic …` (atau nilainya saja). */
export function decodeBasicAuth(source: string): Result<BasicCredentials & { header: string }> {
  // Terima salinan header utuh ("Authorization: Basic …") maupun nilainya saja.
  const withoutName = source.replace(/^\s*authorization\s*:\s*/i, "");
  const trimmed = withoutName.trim();
  if (trimmed === "") {
    return err({ kind: "parse", message: "Tempel header Authorization atau nilai Basic yang akan di-decode." });
  }
  const match = /^basic\s+([A-Za-z0-9+/=]+)$/i.exec(trimmed);
  const payload = match ? match[1] : trimmed;
  if (!/^[A-Za-z0-9+/=]+$/.test(payload ?? "")) {
    return err({ kind: "parse", message: "Bukan nilai Basic yang valid. Isinya harus Base64 setelah kata Basic." });
  }
  let decoded: string;
  try {
    const binary = atob(payload ?? "");
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return err({ kind: "parse", message: "Base64 tidak valid atau hasilnya bukan teks UTF-8." });
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) {
    return err({ kind: "parse", message: "Hasil decode tidak memuat titik dua pemisah username:password." });
  }
  return ok({
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
    header: `Basic ${payload}`,
  });
}

/* ───────────────────────── API key & token acak ────────────────────────── */

export type TokenAlphabet = "alnum" | "hex" | "base64url";

export interface GenerateTokenOptions {
  length: number;
  alphabet: TokenAlphabet;
  /** Awalan opsional, mis. "sk_live_". */
  prefix?: string;
}

const ALPHABETS: Record<TokenAlphabet, string> = {
  alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  hex: "0123456789abcdef",
  base64url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
};

export const TOKEN_ALPHABETS = ALPHABETS;

/**
 * Token acak kriptografis. Memakai `crypto.getRandomValues` dengan rejection
 * sampling agar setiap karakter benar-benar seragam (tanpa bias modulo).
 */
export function generateToken(options: GenerateTokenOptions, randomBytes?: (size: number) => Uint8Array): Result<string> {
  const { length, alphabet, prefix = "" } = options;
  if (!Number.isInteger(length) || length < 1 || length > 512) {
    return err({ kind: "parse", message: "Panjang token harus antara 1 dan 512 karakter." });
  }
  const chars = ALPHABETS[alphabet];
  if (!chars) return err({ kind: "parse", message: "Alfabet token tidak dikenal." });

  const draw = randomBytes ?? ((size: number) => crypto.getRandomValues(new Uint8Array(size)));
  const limit = 256 - (256 % chars.length);
  let output = "";
  while (output.length < length) {
    const buffer = draw(Math.max(8, Math.ceil((length - output.length) * 1.5)));
    for (const byte of buffer) {
      if (byte >= limit) continue; // buang agar tidak bias
      output += chars[byte % chars.length];
      if (output.length === length) break;
    }
  }
  return ok(`${prefix}${output}`);
}

/** Entropi teoretis token (bit) — untuk menilai kekuatan API key. */
export const tokenEntropyBits = (length: number, alphabet: TokenAlphabet): number =>
  length * Math.log2(ALPHABETS[alphabet].length);

/* ───────────────────── Digest untuk verifikasi API key ─────────────────── */

export type DigestAlgorithm = "SHA-256" | "SHA-512" | "SHA-1";

/**
 * Sidik jari API key. Berguna untuk memeriksa API key yang beredar tanpa
 * menyimpan nilai aslinya: hash → Base64 atau hex.
 */
export async function fingerprintToken(
  token: string,
  algorithm: DigestAlgorithm = "SHA-256",
  subtle?: SubtleCrypto,
): Promise<Result<{ hex: string; base64: string }>> {
  if (token === "") {
    return err({ kind: "parse", message: "Tempel API key/token yang akan dihitung sidik jarinya." });
  }
  const engine = (subtle ?? (typeof crypto !== "undefined" ? crypto.subtle : undefined)) as
    | SubtleLike
    | undefined;
  const hashed = await hashText(token, algorithm, engine);
  if (!hashed.ok) return hashed;
  return ok({ hex: hashed.value.hex, base64: hashed.value.base64 });
}
