/**
 * UUID generator — memakai Web Crypto (ADR-0007 §4).
 * v4: acak penuh. v7: berurutan waktu (time-ordered), berguna untuk primary key.
 */

export type UuidVersion = 4 | 7;

/** Sumber byte acak; diinjeksi agar dapat diuji deterministik. */
export type RandomBytes = (length: number) => Uint8Array;

export const cryptoRandomBytes: RandomBytes = (length) => {
  const bytes = new Uint8Array(length);
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("Web Crypto tidak tersedia di lingkungan ini.");
  }
  crypto.getRandomValues(bytes);
  return bytes;
};

const hex = (byte: number): string => byte.toString(16).padStart(2, "0");

function formatUuid(bytes: Uint8Array): string {
  const parts = [
    bytes.slice(0, 4),
    bytes.slice(4, 6),
    bytes.slice(6, 8),
    bytes.slice(8, 10),
    bytes.slice(10, 16),
  ];
  return parts.map((part) => Array.from(part).map(hex).join("")).join("-");
}

export function uuidV4(random: RandomBytes = cryptoRandomBytes): string {
  const bytes = random(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // versi 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // varian RFC 4122
  return formatUuid(bytes);
}

export function uuidV7(random: RandomBytes = cryptoRandomBytes, now = Date.now()): string {
  const bytes = random(16);
  // 48 bit pertama: timestamp milidetik (big-endian).
  const timestamp = BigInt(now);
  for (let index = 0; index < 6; index += 1) {
    const shift = BigInt(8 * (5 - index));
    bytes[index] = Number((timestamp >> shift) & 0xffn);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70; // versi 7
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // varian RFC 4122
  return formatUuid(bytes);
}

export function generateUuids(
  count: number,
  version: UuidVersion,
  random: RandomBytes = cryptoRandomBytes,
  now = Date.now(),
): string[] {
  const total = Math.max(1, Math.min(Math.trunc(count) || 1, 1000));
  return Array.from({ length: total }, () => (version === 7 ? uuidV7(random, now) : uuidV4(random)));
}

/** Label jujur soal sumber acak yang dipakai. */
export function randomSourceLabel(): string {
  if (typeof crypto === "undefined") return "Web Crypto tidak tersedia";
  if (typeof crypto.randomUUID === "function") return "crypto.randomUUID / getRandomValues";
  return "crypto.getRandomValues";
}
