/**
 * Unix timestamp converter — murni, tanpa DOM.
 * Selalu menampilkan UTC dan lokal berdampingan (ADR-0007 §6) agar tidak ambigu.
 */
import { err, ok, type Result } from "@/types/result";

export interface TimestampBreakdown {
  /** Detik sejak epoch (dibulatkan ke bawah). */
  seconds: number;
  /** Milidetik sejak epoch. */
  milliseconds: number;
  iso: string;
  utc: string;
  /** Format lokal; dihitung dengan offset waktu yang diberikan. */
  local: string;
  /** Offset zona waktu lokal dalam menit, mis. +420 untuk UTC+7. */
  offsetMinutes: number;
  relative: string;
}

const pad = (value: number): string => String(Math.abs(value)).padStart(2, "0");

export function formatUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
  );
}

export function formatWithOffset(date: Date, offsetMinutes: number): string {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offsetHours = pad(Math.trunc(Math.abs(offsetMinutes) / 60));
  const offsetRemainder = pad(Math.abs(offsetMinutes) % 60);
  return (
    `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ` +
    `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())} ` +
    `UTC${sign}${offsetHours}:${offsetRemainder}`
  );
}

export function describeRelative(targetMs: number, nowMs: number): string {
  const deltaSeconds = Math.round((targetMs - nowMs) / 1000);
  const future = deltaSeconds > 0;
  const absolute = Math.abs(deltaSeconds);

  const units: Array<[string, number]> = [
    ["tahun", 31_536_000],
    ["bulan", 2_592_000],
    ["hari", 86_400],
    ["jam", 3_600],
    ["menit", 60],
  ];

  for (const [label, seconds] of units) {
    if (absolute >= seconds) {
      const value = Math.floor(absolute / seconds);
      return `${value} ${label} ${future ? "lagi" : "lalu"}`;
    }
  }
  return `${absolute} detik ${future ? "lagi" : "lalu"}`;
}

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Parse berbagai bentuk timestamp tanpa bergantung pada `Date.parse` yang
 * perilakunya berbeda antar mesin.
 */
export function parseTimestamp(
  source: string,
  offsetMinutes: number,
  nowMs: number,
): Result<TimestampBreakdown> {
  const input = source.trim();
  if (input === "") {
    return err({ kind: "parse", message: "Input masih kosong. Masukkan timestamp atau tanggal." });
  }

  let ms: number;

  if (/^-?\d+$/.test(input)) {
    const numeric = Number(input);
    if (!Number.isFinite(numeric)) {
      return err({ kind: "parse", message: "Angka terlalu besar untuk diproses." });
    }
    // Heuristik: >= 1e12 dianggap milidetik, selain itu detik.
    ms = Math.abs(numeric) >= 1e12 ? numeric : numeric * 1000;
  } else if (/^-?\d+(\.\d+)?$/.test(input)) {
    ms = Number(input) * 1000;
  } else {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(
        input,
      );
    if (!match) {
      return err({
        kind: "parse",
        message:
          "Format tidak dikenali. Gunakan angka epoch (detik/milidetik) atau ISO 8601, mis. 2026-11-12T08:30:00Z.",
      });
    }
    const [, yearPart, monthPart, dayPart, hourPart, minutePart, secondPart, zonePart] = match;
    const year = Number(yearPart);
    const month = Number(monthPart);
    const day = Number(dayPart);
    const hour = Number(hourPart ?? 0);
    const minute = Number(minutePart ?? 0);
    const second = Number(secondPart ?? 0);

    if (month < 1 || month > 12) {
      return err({ kind: "parse", message: `Bulan tidak valid: ${month}.` });
    }
    const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      month - 1
    ];
    if (day < 1 || day > (daysInMonth ?? 31)) {
      return err({ kind: "parse", message: `Tanggal tidak valid: ${year}-${monthPart}-${dayPart}.` });
    }
    if (hour > 23 || minute > 59 || second > 59) {
      return err({ kind: "parse", message: "Jam, menit, atau detik di luar rentang." });
    }

    let zoneOffset = offsetMinutes;
    if (zonePart) {
      if (zonePart.toUpperCase() === "Z") {
        zoneOffset = 0;
      } else {
        const sign = zonePart.startsWith("-") ? -1 : 1;
        const digits = zonePart.slice(1).replace(":", "");
        const hours = Number(digits.slice(0, 2));
        const minutes = Number(digits.slice(2));
        zoneOffset = sign * (hours * 60 + minutes);
      }
    }

    ms =
      Date.UTC(year, month - 1, day, hour, minute, second) - zoneOffset * 60_000;
  }

  if (!Number.isFinite(ms)) {
    return err({ kind: "parse", message: "Nilai timestamp tidak dapat diproses." });
  }

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return err({ kind: "parse", message: "Tanggal berada di luar rentang yang didukung." });
  }

  return ok({
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    iso: date.toISOString(),
    utc: formatUtc(date),
    local: formatWithOffset(date, offsetMinutes),
    offsetMinutes,
    relative: describeRelative(ms, nowMs),
  });
}

/** Nilai "sekarang" dalam bentuk siap tampil. */
export function nowBreakdown(offsetMinutes: number, nowMs: number): TimestampBreakdown {
  const result = parseTimestamp(String(nowMs), offsetMinutes, nowMs);
  if (!result.ok) throw new Error("Gagal menyusun timestamp saat ini");
  return result.value;
}
