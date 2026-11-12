import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "@/lib/encoding/base64";

const encode = (input: string, options?: Parameters<typeof encodeBase64>[1]): string => {
  const result = encodeBase64(input, options);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("encodeBase64", () => {
  it("encode ASCII dasar", () => {
    expect(encode("hello")).toBe("aGVsbG8=");
  });

  it("UTF-8 multi-byte tidak rusak", () => {
    expect(encode("café ☕")).toBe(
      Buffer.from("café ☕", "utf8").toString("base64"),
    );
  });

  it("varian urlsafe memakai - dan _", () => {
    const standard = encode("??>>~~");
    const urlsafe = encode("??>>~~", { variant: "urlsafe" });
    expect(urlsafe).not.toMatch(/[+/]/);
    expect(urlsafe.length).toBe(standard.length);
  });

  it("wrap memecah output per 76 karakter", () => {
    const wrapped = encode("a".repeat(200), { wrap: true });
    const lines = wrapped.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0]).toHaveLength(76);
  });

  it("input kosong menghasilkan string kosong", () => {
    expect(encode("")).toBe("");
  });
});

describe("decodeBase64", () => {
  it("decode round-trip ASCII", () => {
    const result = decodeBase64("aGVsbG8=");
    expect(result.ok && result.value).toBe("hello");
  });

  it("decode round-trip UTF-8", () => {
    const result = decodeBase64(encode("café ☕"));
    expect(result.ok && result.value).toBe("café ☕");
  });

  it("menerima varian urlsafe", () => {
    const result = decodeBase64("Pz8-Pn5-", { variant: "urlsafe" });
    expect(result.ok && result.value).toBe("??>>~~");
  });

  it("mengabaikan whitespace/newline", () => {
    const result = decodeBase64("aGVs\nbG8=");
    expect(result.ok && result.value).toBe("hello");
  });

  it("menolak karakter di luar alfabet", () => {
    const result = decodeBase64("aGV*sbG8=");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("bukan Base64");
  });

  it("menolak panjang yang bukan kelipatan 4", () => {
    const result = decodeBase64("abcde");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("kelipatan 4");
  });

  it("menolak input kosong", () => {
    expect(decodeBase64("   ").ok).toBe(false);
  });

  it("menolak byte yang bukan UTF-8 valid", () => {
    // 0xFF sendirian bukan UTF-8 valid
    const result = decodeBase64("/w==");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("UTF-8");
  });
});
