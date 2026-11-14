import { describe, expect, it } from "vitest";
import {
  auditClaims,
  base64UrlEncode,
  decodeBasicAuth,
  encodeBasicAuth,
  fingerprintToken,
  generateToken,
  isJwtAlgorithm,
  readJwt,
  tokenEntropyBits,
  verifyJwtSignature,
} from "@/lib/dev/auth";

const SECRET = "rahasia-uji-yang-cukup-panjang-untuk-hs256";

/** Membuat JWT HS256 bertanda tangan nyata memakai Web Crypto. */
const signHs256 = async (payload: Record<string, unknown>, secret = SECRET): Promise<string> => {
  const encoder = new TextEncoder();
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${base64UrlEncode(new Uint8Array(signature))}`;
};

const readOk = async (token: string) => {
  const parts = readJwt(token);
  if (!parts.ok) throw new Error(parts.error.message);
  return parts.value;
};

describe("readJwt — decode tanpa memeriksa apa pun", () => {
  it("membaca header, payload, dan signature", async () => {
    const token = await signHs256({ sub: "abc", exp: 1_700_000_000 });
    const parts = await readOk(token);
    expect(parts.algorithm).toBe("HS256");
    expect(parts.payload.sub).toBe("abc");
    expect(parts.unsigned).toBe(false);
    expect(parts.signingInput).toBe(`${parts.headerSegment}.${parts.payloadSegment}`);
  });

  it("menandai alg none sebagai unsigned", async () => {
    const header = base64UrlEncode(new TextEncoder().encode('{"alg":"none"}'));
    const payload = base64UrlEncode(new TextEncoder().encode('{"sub":"x"}'));
    const parts = await readOk(`${header}.${payload}.`);
    expect(parts.unsigned).toBe(true);
  });

  it("menolak input yang bukan tiga bagian", () => {
    expect(readJwt("a.b").ok).toBe(false);
    expect(readJwt("a.b.c.d.e").ok).toBe(false);
    expect(readJwt("   ").ok).toBe(false);
  });
});

describe("verifyJwtSignature — kunci dari pengguna, bukan JWKS", () => {
  it("menerima token yang ditandatangani dengan secret yang sama", async () => {
    const token = await signHs256({ sub: "abc" });
    const check = await verifyJwtSignature(await readOk(token), { algorithm: "HS256", key: SECRET });
    expect(check.verdict).toBe("valid");
    expect(check.message).toMatch(/cocok/i);
  });

  it("menolak secret yang salah", async () => {
    const token = await signHs256({ sub: "abc" });
    const check = await verifyJwtSignature(await readOk(token), {
      algorithm: "HS256",
      key: "secret-yang-berbeda",
    });
    expect(check.verdict).toBe("invalid");
  });

  it("menolak token yang payload-nya diubah setelah ditandatangani", async () => {
    const token = await signHs256({ sub: "abc", role: "user" });
    const [header, , signature] = token.split(".");
    const tampered = `${header}.${base64UrlEncode(new TextEncoder().encode('{"sub":"abc","role":"admin"}'))}.${signature}`;
    const check = await verifyJwtSignature(await readOk(tampered), { algorithm: "HS256", key: SECRET });
    expect(check.verdict).toBe("invalid");
  });

  it("menolak alg none tanpa mencoba memverifikasi", async () => {
    const header = base64UrlEncode(new TextEncoder().encode('{"alg":"none"}'));
    const payload = base64UrlEncode(new TextEncoder().encode('{"sub":"x"}'));
    const check = await verifyJwtSignature(await readOk(`${header}.${payload}.`), {
      algorithm: "HS256",
      key: SECRET,
    });
    expect(check.verdict).toBe("unverified");
  });

  it("melaporkan ketidakcocokan algoritma header vs pilihan", async () => {
    const token = await signHs256({ sub: "abc" });
    const check = await verifyJwtSignature(await readOk(token), { algorithm: "RS256", key: SECRET });
    expect(check.verdict).toBe("wrong-algorithm");
    expect(check.message).toMatch(/HS256/);
  });

  it("meminta kunci bila kosong", async () => {
    const token = await signHs256({ sub: "abc" });
    const check = await verifyJwtSignature(await readOk(token), { algorithm: "HS256", key: "  " });
    expect(check.verdict).toBe("error");
    expect(check.message).toMatch(/kunci/i);
  });

  it("menolak signature dengan panjang yang salah untuk ECDSA", async () => {
    const token = await signHs256({ sub: "abc" });
    const parts = await readOk(token);
    const check = await verifyJwtSignature(
      { ...parts, algorithm: "ES256" },
      { algorithm: "ES256", key: "x" },
    );
    expect(check.verdict).toBe("invalid");
    expect(check.message).toMatch(/Panjang signature/);
  });
});

describe("verifyJwtSignature — kunci asimetris", () => {
  it("memverifikasi RS256 dengan public key PEM", async () => {
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const encoder = new TextEncoder();
    const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const payload = base64UrlEncode(encoder.encode(JSON.stringify({ sub: "rsa" })));
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      encoder.encode(`${header}.${payload}`),
    );
    const token = `${header}.${payload}.${base64UrlEncode(new Uint8Array(signature))}`;

    const spki = new Uint8Array(await crypto.subtle.exportKey("spki", pair.publicKey));
    const pem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...spki))}\n-----END PUBLIC KEY-----`;

    const valid = await verifyJwtSignature(await readOk(token), { algorithm: "RS256", key: pem });
    expect(valid.verdict).toBe("valid");

    const otherPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const otherSpki = new Uint8Array(await crypto.subtle.exportKey("spki", otherPair.publicKey));
    const otherPem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...otherSpki))}\n-----END PUBLIC KEY-----`;
    const invalid = await verifyJwtSignature(await readOk(token), { algorithm: "RS256", key: otherPem });
    expect(invalid.verdict).toBe("invalid");
  });

  it("menolak kunci privat dengan pesan yang jelas", async () => {
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...pkcs8))}\n-----END PRIVATE KEY-----`;
    const token = await signHs256({ sub: "abc" });
    const parts = await readOk(token);
    const check = await verifyJwtSignature({ ...parts, algorithm: "RS256" }, { algorithm: "RS256", key: pem });
    expect(check.verdict).toBe("error");
    expect(check.message).toMatch(/kunci privat/i);
  });
});

describe("auditClaims", () => {
  const now = 1_700_000_000;

  it("menandai token kedaluwarsa", () => {
    const [exp] = auditClaims({ exp: now - 60 }, { nowSeconds: now });
    expect(exp?.state).toBe("fail");
  });

  it("memberi sisa waktu untuk token yang masih berlaku", () => {
    const [exp] = auditClaims({ exp: now + 600 }, { nowSeconds: now });
    expect(exp?.state).toBe("ok");
    expect(exp?.note).toMatch(/10 menit/);
  });

  it("menandai token tanpa exp sebagai celah", () => {
    const [exp] = auditClaims({}, { nowSeconds: now });
    expect(exp?.state).toBe("gap");
  });

  it("membandingkan issuer dan audience yang diharapkan", () => {
    const checks = auditClaims(
      { exp: now + 60, iss: "https://auth.example.com", aud: ["api", "web"] },
      { nowSeconds: now, expectedIssuer: "https://auth.example.com", expectedAudience: "web" },
    );
    expect(checks.find((check) => check.claim === "iss")?.state).toBe("ok");
    expect(checks.find((check) => check.claim === "aud")?.state).toBe("ok");

    const mismatch = auditClaims(
      { iss: "https://lain.example.com", aud: "mobile" },
      { nowSeconds: now, expectedIssuer: "https://auth.example.com", expectedAudience: "web" },
    );
    expect(mismatch.find((check) => check.claim === "iss")?.state).toBe("fail");
    expect(mismatch.find((check) => check.claim === "aud")?.state).toBe("fail");
  });

  it("menghormati toleransi clock skew", () => {
    const [exp] = auditClaims({ exp: now - 20 }, { nowSeconds: now, clockToleranceSeconds: 60 });
    expect(exp?.state).toBe("ok");
  });
});

describe("Basic Auth", () => {
  it("meng-encode ke header Basic", () => {
    const result = encodeBasicAuth({ username: "rani", password: "s3cret" });
    expect(result).toEqual({ ok: true, value: `Basic ${btoa("rani:s3cret")}` });
  });

  it("UTF-8 aman dan bolak-balik", () => {
    const encoded = encodeBasicAuth({ username: "rani", password: "kata sandi ☕" });
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = decodeBasicAuth(encoded.value);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.username).toBe("rani");
      expect(decoded.value.password).toBe("kata sandi ☕");
    }
  });

  it("menerima salinan header utuh dengan nama Authorization", () => {
    const decoded = decodeBasicAuth(`Authorization: Basic ${btoa("rani:s3cret")}`);
    expect(decoded.ok && decoded.value.username).toBe("rani");
    expect(decoded.ok && decoded.value.password).toBe("s3cret");
  });

  it("menerima nilai Base64 tanpa kata Basic", () => {
    const decoded = decodeBasicAuth(btoa("dev:rahasia"));
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value.username).toBe("dev");
  });

  it("menolak Base64 yang tidak memuat titik dua", () => {
    const decoded = decodeBasicAuth(btoa("tanpa-pemisah"));
    expect(decoded.ok).toBe(false);
  });

  it("menolak username bertitik dua saat encode", () => {
    expect(encodeBasicAuth({ username: "a:b", password: "x" }).ok).toBe(false);
  });
});

describe("generateToken", () => {
  it("menghasilkan panjang dan alfabet yang diminta", () => {
    const result = generateToken({ length: 32, alphabet: "hex", prefix: "sk_live_" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatch(/^sk_live_[0-9a-f]{32}$/);
  });

  it("menghasilkan nilai berbeda setiap panggilan", () => {
    const first = generateToken({ length: 24, alphabet: "alnum" });
    const second = generateToken({ length: 24, alphabet: "alnum" });
    expect(first.ok && second.ok && first.value !== second.value).toBe(true);
  });

  it("membuang byte di atas batas agar tidak bias", () => {
    // Alfabet 62 karakter: 256 % 62 = 8, jadi byte ≥ 248 harus dibuang.
    const sequence = [0, 255, 254, 250, 249, 248, 1, 2, 3, 4, 5, 6];
    let index = 0;
    const result = generateToken(
      { length: 4, alphabet: "alnum" },
      (size) => Uint8Array.from({ length: size }, () => sequence[index++ % sequence.length] ?? 0),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(4);
  });

  it("menolak panjang di luar batas", () => {
    expect(generateToken({ length: 0, alphabet: "hex" }).ok).toBe(false);
    expect(generateToken({ length: 513, alphabet: "hex" }).ok).toBe(false);
  });

  it("menghitung entropi teoretis", () => {
    expect(tokenEntropyBits(32, "hex")).toBe(128);
    expect(Math.round(tokenEntropyBits(43, "base64url"))).toBe(258);
  });
});

describe("fingerprintToken", () => {
  it("menghasilkan SHA-256 hex dan Base64 yang konsisten", async () => {
    const result = await fingerprintToken("sk_live_abc", "SHA-256");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Dibandingkan dengan `printf 'sk_live_abc' | sha256sum`, bukan angka karangan.
    expect(result.value.hex).toBe(
      "b2817799acd7f3337c32f967a7c4ca32a767c94190298bace3e0447120385c09",
    );
    expect(result.value.base64).toBe("soF3mazX8zN8Mvlnp8TKMqdnyUGQKYus4+BEcSA4XAk=");
  });

  it("memberi hasil berbeda untuk token berbeda", async () => {
    const a = await fingerprintToken("token-a");
    const b = await fingerprintToken("token-b");
    expect(a.ok && b.ok && a.value.hex !== b.value.hex).toBe(true);
  });

  it("menolak input kosong", async () => {
    expect((await fingerprintToken("")).ok).toBe(false);
  });
});

describe("isJwtAlgorithm", () => {
  it("mengenali algoritma yang didukung saja", () => {
    expect(isJwtAlgorithm("HS256")).toBe(true);
    expect(isJwtAlgorithm("EdDSA")).toBe(true);
    expect(isJwtAlgorithm("none")).toBe(false);
    expect(isJwtAlgorithm("HS999")).toBe(false);
  });
});
