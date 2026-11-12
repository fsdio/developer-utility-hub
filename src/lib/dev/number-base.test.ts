import { describe, expect, it } from "vitest";
import { groupBinary, parseNumber } from "@/lib/dev/number-base";

const parse = (input: string, base: Parameters<typeof parseNumber>[1]) => {
  const result = parseNumber(input, base);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("parseNumber", () => {
  it("desimal ke semua basis", () => {
    const value = parse("255", 10);
    expect(value.hex).toBe("ff");
    expect(value.binary).toBe("11111111");
    expect(value.octal).toBe("377");
    expect(value.bits).toBe(8);
  });

  it("heksadesimal dengan dan tanpa prefix", () => {
    expect(parse("0xFF", 16).decimal).toBe("255");
    expect(parse("ff", 16).decimal).toBe("255");
    expect(parse("FF", 16).decimal).toBe("255");
  });

  it("biner dengan prefix", () => {
    expect(parse("0b1010", 2).decimal).toBe("10");
  });

  it("oktal dengan prefix", () => {
    expect(parse("0o17", 8).decimal).toBe("15");
  });

  it("mendukung angka negatif", () => {
    const value = parse("-255", 10);
    expect(value.binary).toBe("-11111111");
    expect(value.negative).toBe(true);
  });

  it("presisi tinggi dengan BigInt, bukan Number", () => {
    const value = parse("18446744073709551615", 10);
    expect(value.hex).toBe("ffffffffffffffff");
    expect(value.bits).toBe(64);
  });

  it("mengabaikan pemisah underscore", () => {
    expect(parse("1111_0000", 2).decimal).toBe("240");
  });

  it("menolak digit di luar basis", () => {
    const result = parseNumber("12", 2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("0, 1");
  });

  it("menolak input kosong dan input hanya prefix", () => {
    expect(parseNumber("", 10).ok).toBe(false);
    expect(parseNumber("0x", 16).ok).toBe(false);
  });
});

describe("groupBinary", () => {
  it("mengelompokkan per 4 bit dari kiri", () => {
    expect(groupBinary("11111111")).toBe("1111 1111");
    expect(groupBinary("101")).toBe("0101");
  });

  it("mempertahankan tanda negatif", () => {
    expect(groupBinary("-11110000")).toBe("-1111 0000");
  });
});
