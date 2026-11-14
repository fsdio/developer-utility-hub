/**
 * Base64 untuk **berkas biner** (gambar/font/PDF) — murni, tanpa DOM.
 *
 * Dipakai dua tool:
 * - Gambar ⇄ Base64 (`#/tools/image-base64`)
 * - PDF ⇄ Base64 (`#/tools/pdf-base64`)
 *
 * Semua fungsi di sini menerima/mengembalikan string dan `Uint8Array`, tidak
 * pernah menyentuh `File`, `Blob`, `document`, atau `window` (ADR-0007 batas
 * modul). Pembacaan berkas dilakukan di layer browser.
 */
import { ok, err, type Result } from "@/types/result";
import { bytesToBase64, decodeBase64ToBytes } from "@/lib/encoding/base64";

export { bytesToBase64 };

/** Batas ukuran berkas untuk konversi di memori (ADR-0017). */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Batas panjang teks Base64 yang boleh ditempel (≈ 15 MB berkas asal). */
export const MAX_BASE64_LENGTH = 20 * 1024 * 1024;

export type FileKind = "image" | "pdf" | "font" | "unknown";

export interface DetectedFile {
  kind: FileKind;
  /** MIME yang bisa dipakai untuk `data:` URL. */
  mime: string;
  /** Ekstensi tanpa titik, untuk nama unduhan. */
  extension: string;
  /** Nama jenis yang ramah dibaca, mis. "PNG". */
  label: string;
}

const SIGNATURES: ReadonlyArray<{
  bytes: readonly number[];
  offset?: number;
  detected: DetectedFile;
}> = [
  { bytes: [0x89, 0x50, 0x4e, 0x47], detected: { kind: "image", mime: "image/png", extension: "png", label: "PNG" } },
  { bytes: [0xff, 0xd8, 0xff], detected: { kind: "image", mime: "image/jpeg", extension: "jpg", label: "JPEG" } },
  { bytes: [0x47, 0x49, 0x46, 0x38], detected: { kind: "image", mime: "image/gif", extension: "gif", label: "GIF" } },
  { bytes: [0x42, 0x4d], detected: { kind: "image", mime: "image/bmp", extension: "bmp", label: "BMP" } },
  { bytes: [0x25, 0x50, 0x44, 0x46], detected: { kind: "pdf", mime: "application/pdf", extension: "pdf", label: "PDF" } },
  { bytes: [0x77, 0x4f, 0x46, 0x46], detected: { kind: "font", mime: "font/woff", extension: "woff", label: "WOFF" } },
  { bytes: [0x77, 0x4f, 0x46, 0x32], detected: { kind: "font", mime: "font/woff2", extension: "woff2", label: "WOFF2" } },
  { bytes: [0x00, 0x01, 0x00, 0x00], detected: { kind: "font", mime: "font/ttf", extension: "ttf", label: "TTF" } },
  { bytes: [0x4f, 0x54, 0x54, 0x4f], detected: { kind: "font", mime: "font/otf", extension: "otf", label: "OTF" } },
  // "RIFF" baru WEBP bila diikuti "WEBP" pada offset 8; "ftyp" AVIF diperiksa
  // terpisah karena penandanya di offset 4.
  { bytes: [0x52, 0x49, 0x46, 0x46], detected: { kind: "image", mime: "image/webp", extension: "webp", label: "WEBP" } },
];

const UNKNOWN: DetectedFile = {
  kind: "unknown",
  mime: "application/octet-stream",
  extension: "bin",
  label: "Berkas biner",
};

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean => {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
};

/**
 * Menentukan jenis berkas dari magic bytes, bukan dari nama berkas — nama bisa
 * menipu dan tidak selalu ada saat pengguna menempel Base64.
 */
export function detectFile(bytes: Uint8Array): DetectedFile {
  // SVG berupa teks: cek awalannya sebagai UTF-8 longgar.
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 256)).trimStart();
  if (head.toLowerCase().startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return { kind: "image", mime: "image/svg+xml", extension: "svg", label: "SVG" };
  }

  for (const entry of SIGNATURES) {
    if (!startsWith(bytes, entry.bytes, entry.offset ?? 0)) continue;
    // "RIFF" hanya WEBP bila diikuti "WEBP" pada offset 8.
    if (entry.detected.mime === "image/webp" && !startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
      continue;
    }
    return entry.detected;
  }
  if (startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    return { kind: "image", mime: "image/avif", extension: "avif", label: "AVIF" };
  }
  return UNKNOWN;
}

export interface DataUrl {
  mime: string;
  base64: string;
}

const DATA_URL_RE = /^data:([^;,]*)((?:;[^,;]*)*),([\s\S]*)$/;

/**
 * Memisahkan `data:` URL menjadi MIME + Base64. Bentuk non-Base64 (`data:…,teks`)
 * di-encode ke Base64 agar keluarannya selalu satu format.
 */
export function parseDataUrl(source: string): Result<DataUrl> {
  const match = DATA_URL_RE.exec(source.trim());
  if (!match) {
    return err({ kind: "parse", message: "Bukan data URL. Formatnya: data:<mime>;base64,<isi>." });
  }
  const mime = (match[1] ?? "").trim() || "text/plain";
  const params = match[2] ?? "";
  const payload = match[3] ?? "";

  if (/;base64/i.test(params)) {
    return ok({ mime, base64: payload.replace(/\s+/g, "") });
  }
  try {
    const bytes = new TextEncoder().encode(decodeURIComponent(payload));
    return ok({ mime, base64: bytesToBase64(bytes) });
  } catch {
    return err({ kind: "parse", message: "Isi data URL tidak bisa dibaca sebagai teks." });
  }
}

/** Membersihkan teks Base64 dari spasi/baris baru dan tanda kutip pembungkus. */
export function normalizeBase64(source: string): string {
  let value = source.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/\s+/g, "");
}

export interface Base64File {
  /** Isi Base64 (tanpa awalan data URL). */
  base64: string;
  detected: DetectedFile;
  /** `true` bila input berupa data URL lengkap. */
  wasDataUrl: boolean;
}

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/** Decode Base64 menjadi byte; menerima bentuk berbaris (btoa/atob native). */
export const base64ToBytes = (base64: string): Result<Uint8Array> => decodeBase64ToBytes(base64);

/**
 * Menerima Base64 mentah **atau** data URL, lalu mengembalikan isi Base64 dan
 * jenis berkasnya. Input kosong / bukan Base64 menjadi error yang bisa ditindak.
 */
export function readBase64Source(source: string): Result<Base64File> {
  const trimmed = source.trim();
  if (trimmed === "") {
    return err({ kind: "parse", message: "Tempel Base64 atau data URL terlebih dahulu." });
  }
  if (trimmed.length > MAX_BASE64_LENGTH) {
    return err({
      kind: "limit",
      message: `Teks Base64 melebihi ${MAX_BASE64_LENGTH.toLocaleString("id-ID")} karakter.`,
    });
  }

  const wasDataUrl = trimmed.startsWith("data:");
  let base64: string;
  let declaredMime: string | null = null;

  if (wasDataUrl) {
    const parsed = parseDataUrl(trimmed);
    if (!parsed.ok) return parsed;
    base64 = parsed.value.base64;
    declaredMime = parsed.value.mime;
  } else {
    base64 = normalizeBase64(trimmed);
  }

  if (!BASE64_RE.test(base64) || base64.length % 4 !== 0) {
    return err({
      kind: "parse",
      message: "Isi bukan Base64 yang valid (alfabet Base64, panjang kelipatan 4).",
    });
  }

  // Deteksi butuh byte awal saja: decode potongan pertama (≤ 48 byte).
  const head = base64ToBytes(base64.slice(0, 64 - (base64.slice(0, 64).length % 4)));
  const fromSignature = head.ok ? detectFile(head.value) : UNKNOWN;
  const detected =
    declaredMime !== null ? { ...detectFileMime(declaredMime), mime: declaredMime } : fromSignature;

  return ok({ base64, detected, wasDataUrl });
}

/** Ukuran berkas hasil decode, dihitung dari panjang Base64 tanpa decode penuh. */
export function decodedByteLength(base64: string): number {
  const compact = base64.replace(/\s+/g, "");
  if (compact === "") return 0;
  const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((compact.length * 3) / 4) - padding);
}

const MIME_TABLE: ReadonlyArray<[RegExp, DetectedFile]> = [
  [/^image\/png$/, { kind: "image", mime: "image/png", extension: "png", label: "PNG" }],
  [/^image\/jpe?g$/, { kind: "image", mime: "image/jpeg", extension: "jpg", label: "JPEG" }],
  [/^image\/gif$/, { kind: "image", mime: "image/gif", extension: "gif", label: "GIF" }],
  [/^image\/webp$/, { kind: "image", mime: "image/webp", extension: "webp", label: "WEBP" }],
  [/^image\/svg\+xml$/, { kind: "image", mime: "image/svg+xml", extension: "svg", label: "SVG" }],
  [/^image\/bmp$/, { kind: "image", mime: "image/bmp", extension: "bmp", label: "BMP" }],
  [/^image\/avif$/, { kind: "image", mime: "image/avif", extension: "avif", label: "AVIF" }],
  [/^application\/pdf$/, { kind: "pdf", mime: "application/pdf", extension: "pdf", label: "PDF" }],
  [/^font\/woff2$/, { kind: "font", mime: "font/woff2", extension: "woff2", label: "WOFF2" }],
  [/^font\/woff$/, { kind: "font", mime: "font/woff", extension: "woff", label: "WOFF" }],
  [/^text\/plain$/, { kind: "unknown", mime: "text/plain", extension: "txt", label: "Teks" }],
];

/** MIME yang dideklarasikan data URL dipetakan ke metadata jenis berkas. */
function detectFileMime(mime: string): DetectedFile {
  const normalized = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  for (const [pattern, detected] of MIME_TABLE) {
    if (pattern.test(normalized)) return detected;
  }
  return { ...UNKNOWN, mime: normalized || UNKNOWN.mime };
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
