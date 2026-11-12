import { describe, expect, it } from "vitest";
import { decodeUrl, encodeUrl } from "@/lib/encoding/url";

const encode = (input: string, mode?: Parameters<typeof encodeUrl>[1]): string => {
  const result = encodeUrl(input, mode);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("encodeUrl", () => {
  it("meng-encode karakter khusus", () => {
    expect(encode("a b&c=d")).toBe("a%20b%26c%3Dd");
  });

  it("mode form memakai + untuk spasi", () => {
    expect(encode("a b", "form")).toBe("a+b");
  });

  it("mempertahankan karakter unreserved", () => {
    expect(encode("abc-_.!~*'()")).toBe("abc-_.!~*'()");
  });

  it("UTF-8 di-encode per byte", () => {
    expect(encode("café")).toBe("caf%C3%A9");
  });
});

describe("decodeUrl", () => {
  it("decode round-trip", () => {
    const result = decodeUrl(encode("a b&c=d"));
    expect(result.ok && result.value).toBe("a b&c=d");
  });

  it("plusAsSpace mengubah + menjadi spasi", () => {
    const result = decodeUrl("a+b", { plusAsSpace: true });
    expect(result.ok && result.value).toBe("a b");
  });

  it("plus dipertahankan bila plusAsSpace mati", () => {
    const result = decodeUrl("a+b");
    expect(result.ok && result.value).toBe("a+b");
  });

  it("melaporkan posisi escape tidak lengkap", () => {
    const result = decodeUrl("abc%2");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("posisi 4");
      expect(result.error.message).toContain("heksadesimal");
    }
  });
});
