import { describe, expect, it } from "vitest";
import {
  describeRelative,
  formatUtc,
  formatWithOffset,
  nowBreakdown,
  parseTimestamp,
} from "@/lib/dev/timestamp";

const WIB = 7 * 60; // UTC+7

const parse = (input: string, offset = WIB, now = 1_780_000_000_000) => {
  const result = parseTimestamp(input, offset, now);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("parseTimestamp — epoch", () => {
  it("membaca detik epoch", () => {
    const value = parse("1700000000");
    expect(value.seconds).toBe(1_700_000_000);
    expect(value.iso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("membaca milidetik epoch", () => {
    const value = parse("1700000000123");
    expect(value.milliseconds).toBe(1_700_000_000_123);
  });

  it("membaca epoch negatif", () => {
    const value = parse("-1");
    expect(value.iso).toBe("1969-12-31T23:59:59.000Z");
  });

  it("menampilkan UTC dan lokal berdampingan", () => {
    const value = parse("1700000000");
    expect(value.utc).toBe("2023-11-14 22:13:20 UTC");
    expect(value.local).toBe("2023-11-15 05:13:20 UTC+07:00");
    expect(value.offsetMinutes).toBe(WIB);
  });
});

describe("parseTimestamp — ISO", () => {
  it("membaca ISO dengan Z", () => {
    const value = parse("2026-11-12T08:30:00Z");
    expect(value.iso).toBe("2026-11-12T08:30:00.000Z");
  });

  it("membaca ISO dengan offset eksplisit", () => {
    const value = parse("2026-11-12T15:30:00+07:00");
    expect(value.iso).toBe("2026-11-12T08:30:00.000Z");
  });

  it("membaca ISO dengan offset negatif", () => {
    const value = parse("2026-11-12T03:30:00-05:00");
    expect(value.iso).toBe("2026-11-12T08:30:00.000Z");
  });

  it("tanggal saja memakai zona lokal", () => {
    const value = parse("2026-11-12");
    expect(value.iso).toBe("2026-11-11T17:00:00.000Z");
  });

  it("tidak menerima 30 Februari", () => {
    const result = parseTimestamp("2026-02-30T00:00:00Z", WIB, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("Tanggal tidak valid");
  });

  it("menerima 29 Februari pada tahun kabisat", () => {
    expect(parse("2028-02-29T00:00:00Z").iso).toBe("2028-02-29T00:00:00.000Z");
  });

  it("menolak 29 Februari pada tahun non-kabisat", () => {
    expect(parseTimestamp("2026-02-29T00:00:00Z", WIB, 0).ok).toBe(false);
  });

  it("menolak bulan, jam, dan menit di luar rentang", () => {
    expect(parseTimestamp("2026-13-01T00:00:00Z", WIB, 0).ok).toBe(false);
    expect(parseTimestamp("2026-11-12T24:00:00Z", WIB, 0).ok).toBe(false);
    expect(parseTimestamp("2026-11-12T10:60:00Z", WIB, 0).ok).toBe(false);
  });

  it("menolak format asing dengan pesan yang menjelaskan format yang diterima", () => {
    const result = parseTimestamp("12 November 2026", WIB, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("ISO 8601");
  });

  it("menolak input kosong", () => {
    expect(parseTimestamp("  ", WIB, 0).ok).toBe(false);
  });
});

describe("formatUtc / formatWithOffset", () => {
  it("memformat UTC", () => {
    expect(formatUtc(new Date("2026-01-02T03:04:05Z"))).toBe("2026-01-02 03:04:05 UTC");
  });

  it("memformat offset positif dan negatif", () => {
    const date = new Date("2026-01-02T03:04:05Z");
    expect(formatWithOffset(date, 330)).toBe("2026-01-02 08:34:05 UTC+05:30");
    expect(formatWithOffset(date, -480)).toBe("2026-01-01 19:04:05 UTC-08:00");
  });
});

describe("describeRelative", () => {
  const now = 1_700_000_000_000;

  it("menyebut masa lalu dan masa depan", () => {
    expect(describeRelative(now - 3600_000 * 3, now)).toBe("3 jam lalu");
    expect(describeRelative(now + 86_400_000 * 2, now)).toBe("2 hari lagi");
  });

  it("menangani detik", () => {
    expect(describeRelative(now - 5_000, now)).toBe("5 detik lalu");
  });

  it("menangani tahun", () => {
    expect(describeRelative(now - 31_536_000_000 * 2, now)).toBe("2 tahun lalu");
  });
});

describe("nowBreakdown", () => {
  it("mengembalikan breakdown untuk epoch yang diberikan", () => {
    const value = nowBreakdown(0, 1_700_000_000_000);
    expect(value.iso).toBe("2023-11-14T22:13:20.000Z");
    expect(value.relative).toBe("0 detik lalu");
  });
});
