/**
 * Number base converter (biner / oktal / desimal / heksadesimal).
 * Murni. Memakai BigInt agar nilai besar tidak kehilangan presisi.
 */
import { err, ok, type Result } from "@/types/result";

export const NUMBER_BASES = [2, 8, 10, 16] as const;
export type NumberBase = (typeof NUMBER_BASES)[number];

export interface NumberConversion {
  decimal: string;
  binary: string;
  octal: string;
  hex: string;
  /** true bila input negatif (direpresentasikan dengan tanda minus). */
  negative: boolean;
  bits: number;
}

const DIGITS: Record<number, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
};

const PREFIX: Record<number, string> = { 2: "0b", 8: "0o", 10: "", 16: "0x" };

export function parseNumber(source: string, base: NumberBase): Result<NumberConversion> {
  const trimmed = source.trim();
  if (trimmed === "") {
    return err({ kind: "parse", message: "Input masih kosong. Masukkan angka." });
  }

  const negative = trimmed.startsWith("-");
  const body = (negative ? trimmed.slice(1) : trimmed).replace(/^0[bBoOxX]/, "").replace(/_/g, "");

  if (body === "") {
    return err({ kind: "parse", message: "Input tidak berisi digit angka." });
  }
  if (!DIGITS[base]?.test(body)) {
    return err({
      kind: "parse",
      message: `Bukan angka basis ${base} yang valid. Digit yang diizinkan: ${allowedDigits(base)}.`,
    });
  }

  let value: bigint;
  try {
    value = BigInt(`${PREFIX[base]}${body}`);
  } catch {
    return err({ kind: "parse", message: `Gagal membaca angka basis ${base}.` });
  }

  const signed = negative ? -value : value;
  const magnitude = signed < 0n ? -signed : signed;

  return ok({
    decimal: signed.toString(10),
    binary: signed.toString(2),
    octal: signed.toString(8),
    hex: signed.toString(16),
    negative,
    bits: magnitude === 0n ? 1 : magnitude.toString(2).length,
  });
}

function allowedDigits(base: NumberBase): string {
  switch (base) {
    case 2:
      return "0, 1";
    case 8:
      return "0–7";
    case 10:
      return "0–9";
    case 16:
      return "0–9, a–f";
    default:
      return "-";
  }
}

/** Representasi biner berkelompok 4 bit dari kiri (mis. 1010 1101). */
export function groupBinary(binary: string, groupSize = 4): string {
  const negative = binary.startsWith("-");
  const digits = negative ? binary.slice(1) : binary;
  const padded = digits.padStart(Math.ceil(digits.length / groupSize) * groupSize, "0");
  const groups = padded.match(new RegExp(`.{1,${groupSize}}`, "g")) ?? [digits];
  return `${negative ? "-" : ""}${groups.join(" ")}`;
}
