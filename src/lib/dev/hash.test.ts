import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { HASH_ALGORITHMS, hashText, type SubtleLike } from "@/lib/dev/hash";

/** Implementasi Web Crypto nyata untuk test (Node 22 menyediakan crypto.subtle). */
const subtle: SubtleLike = {
  digest: (algorithm, data) => crypto.subtle.digest(algorithm, data as unknown as BufferSource),
};

describe("hashText", () => {
  it("SHA-256 cocok dengan referensi Node", async () => {
    const result = await hashText("hello world", "SHA-256", subtle);
    const expected = createHash("sha256").update("hello world", "utf8").digest("hex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hex).toBe(expected);
      expect(result.value.bits).toBe(256);
    }
  });

  it("SHA-512 cocok dengan referensi Node", async () => {
    const result = await hashText("café ☕", "SHA-512", subtle);
    const expected = createHash("sha512").update("café ☕", "utf8").digest("hex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hex).toBe(expected);
      expect(result.value.bits).toBe(512);
    }
  });

  it("SHA-1 tersedia untuk kebutuhan legacy", async () => {
    const result = await hashText("abc", "SHA-1", subtle);
    const expected = createHash("sha1").update("abc", "utf8").digest("hex");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.hex).toBe(expected);
  });

  it("menghasilkan base64 dari digest yang sama", async () => {
    const result = await hashText("hello world", "SHA-256", subtle);
    const expected = createHash("sha256").update("hello world", "utf8").digest("base64");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.base64).toBe(expected);
  });

  it("input kosong menghasilkan hash yang valid, bukan error", async () => {
    const result = await hashText("", "SHA-256", subtle);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.hex).toBe(createHash("sha256").digest("hex"));
  });

  it("memberi pesan jelas bila Web Crypto tidak tersedia", async () => {
    const result = await hashText("x", "SHA-256", undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Web Crypto tidak tersedia");
      expect(result.error.message).toContain("konteks aman");
    }
  });

  it("semua algoritma yang diekspos dapat dipakai", async () => {
    for (const algorithm of HASH_ALGORITHMS) {
      const result = await hashText("abc", algorithm, subtle);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.hex.length).toBe(result.value.bits / 4);
    }
  });
});
