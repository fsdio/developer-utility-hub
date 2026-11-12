import { describe, expect, it } from "vitest";
import { CLAIM_STATE_LABELS, decodeJwt } from "@/lib/dev/jwt";

const b64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (
  header: Record<string, unknown> = { alg: "HS256", typ: "JWT" },
  payload: Record<string, unknown> = { sub: "1234567890", name: "Rani" },
  signature = "c2lnbmF0dXJl",
): string => `${b64url(header)}.${b64url(payload)}.${signature}`;

const decode = (token: string, now = 1_700_000_000) => {
  const result = decodeJwt(token, now);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("decodeJwt — happy path", () => {
  it("membaca header, payload, dan signature", () => {
    const value = decode(makeToken());
    expect(value.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(value.payload).toEqual({ sub: "1234567890", name: "Rani" });
    expect(value.signature).toBe("c2lnbmF0dXJl");
    expect(value.algorithm).toBe("HS256");
  });

  it("selalu menyatakan signature tidak diverifikasi", () => {
    const value = decode(makeToken());
    expect(value.signatureVerified).toBe(false);
    expect(value.unsigned).toBe(false);
  });

  it("menerima UTF-8 di payload", () => {
    const value = decode(makeToken(undefined, { nama: "Rani — café ☕" }));
    expect(value.payload.nama).toBe("Rani — café ☕");
  });

  it("menerima token tanpa padding dan tanpa signature", () => {
    const value = decode(`${b64url({ alg: "none" })}.${b64url({ sub: "x" })}.`);
    expect(value.signature).toBe("");
    expect(value.unsigned).toBe(true);
  });
});

describe("decodeJwt — penolakan struktur", () => {
  it("menolak input kosong", () => {
    const result = decodeJwt("   ");
    expect(result.ok).toBe(false);
  });

  it("menolak jumlah bagian yang salah", () => {
    const result = decodeJwt("a.b");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("3 bagian");
  });

  it("menolak JWE 5 bagian dengan penjelasan eksplisit", () => {
    const result = decodeJwt("a.b.c.d.e");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("JWE");
      expect(result.error.message).toContain("terenkripsi");
    }
  });

  it("menolak segmen bukan Base64URL", () => {
    const result = decodeJwt("aGVhZGVy!@@.e30.sig");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("Base64URL");
  });

  it("menolak payload yang bukan JSON", () => {
    const token = `${b64url({ alg: "HS256" })}.${Buffer.from("bukan json").toString("base64url")}.sig`;
    const result = decodeJwt(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("objek JSON");
  });

  it("menolak payload JSON yang bukan objek (array)", () => {
    const token = `${b64url({ alg: "HS256" })}.${b64url([1, 2, 3])}.sig`;
    expect(decodeJwt(token).ok).toBe(false);
  });

  it("menolak token yang terlalu panjang", () => {
    const result = decodeJwt("a".repeat(70_000));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("limit");
  });
});

describe("decodeJwt — alg none", () => {
  it("menandai token tanpa signature", () => {
    const value = decode(makeToken({ alg: "none" }, { sub: "x" }, ""));
    expect(value.unsigned).toBe(true);
    expect(value.algorithm).toBe("none");
  });

  it("tidak menilai keamanan algoritma lain", () => {
    expect(decode(makeToken({ alg: "HS256" })).unsigned).toBe(false);
    expect(decode(makeToken({ alg: "RS256" })).unsigned).toBe(false);
  });

  it("algorithm null bila header tidak memuat alg", () => {
    expect(decode(makeToken({ typ: "JWT" })).algorithm).toBeNull();
  });
});

describe("decodeJwt — claim waktu", () => {
  const now = 1_700_000_000;

  it("menandai exp yang sudah lewat", () => {
    const value = decode(makeToken(undefined, { sub: "x", exp: now - 60 }), now);
    const exp = value.claims.find((claim) => claim.claim === "exp");
    expect(exp?.state).toBe("expired");
    expect(exp?.iso).toBe(new Date((now - 60) * 1000).toISOString());
  });

  it("menandai exp yang masih berlaku", () => {
    const value = decode(makeToken(undefined, { exp: now + 3600 }), now);
    expect(value.claims.find((c) => c.claim === "exp")?.state).toBe("within-window");
  });

  it("menandai nbf di masa depan", () => {
    const value = decode(makeToken(undefined, { nbf: now + 3600 }), now);
    expect(value.claims.find((c) => c.claim === "nbf")?.state).toBe("not-yet-valid");
  });

  it("menampilkan iat sebagai waktu terbit", () => {
    const value = decode(makeToken(undefined, { iat: now }), now);
    expect(value.claims.find((c) => c.claim === "iat")?.state).toBe("issued");
  });

  it("mengabaikan claim waktu yang bukan angka", () => {
    const value = decode(makeToken(undefined, { exp: "besok" }), now);
    expect(value.claims).toHaveLength(0);
  });

  it("urutan claim stabil: iat, nbf, exp", () => {
    const value = decode(makeToken(undefined, { exp: now + 10, nbf: now - 10, iat: now - 20 }), now);
    expect(value.claims.map((claim) => claim.claim)).toEqual(["iat", "nbf", "exp"]);
  });

  it("label status tidak memakai kata 'valid'", () => {
    for (const label of Object.values(CLAIM_STATE_LABELS)) {
      expect(label).not.toMatch(/\bvalid\b/i);
    }
  });
});
