import { describe, expect, it } from "vitest";
import {
  MAX_BASE64_LENGTH,
  base64ToBytes,
  bytesToBase64,
  decodedByteLength,
  detectFile,
  formatBytes,
  normalizeBase64,
  parseDataUrl,
  readBase64Source,
} from "@/lib/encoding/file-base64";

const bytes = (...values: number[]): Uint8Array => new Uint8Array(values);
const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);

/** PNG 1×1 transparan (67 byte) — berkas nyata, bukan string karangan. */
const PNG_1PX = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);

const PDF_MINIMAL = ascii("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n");

describe("detectFile — dari magic bytes, bukan nama berkas", () => {
  it("mengenali PNG, JPEG, dan PDF", () => {
    expect(detectFile(PNG_1PX)).toMatchObject({ kind: "image", mime: "image/png", extension: "png" });
    expect(detectFile(bytes(0xff, 0xd8, 0xff, 0xe0))).toMatchObject({ mime: "image/jpeg", extension: "jpg" });
    expect(detectFile(PDF_MINIMAL)).toMatchObject({ kind: "pdf", mime: "application/pdf" });
  });

  it("RIFF hanya WEBP bila diikuti WEBP", () => {
    const webp = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50);
    const riffBiasa = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45);
    expect(detectFile(webp).mime).toBe("image/webp");
    expect(detectFile(riffBiasa).mime).toBe("application/octet-stream");
  });

  it("mengenali SVG dari awal teksnya", () => {
    expect(detectFile(ascii('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).mime).toBe("image/svg+xml");
    expect(detectFile(ascii('<?xml version="1.0"?><svg/>')).mime).toBe("image/svg+xml");
  });

  it("mengenali WOFF2 dan AVIF", () => {
    expect(detectFile(bytes(0x77, 0x4f, 0x46, 0x32)).extension).toBe("woff2");
    expect(detectFile(bytes(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66)).mime).toBe(
      "image/avif",
    );
  });

  it("berkas tak dikenal jatuh ke octet-stream, bukan menebak", () => {
    expect(detectFile(bytes(1, 2, 3, 4)).kind).toBe("unknown");
  });
});

describe("bytesToBase64 / base64ToBytes", () => {
  it("bolak-balik untuk semua sisa pembagian 3", () => {
    for (const size of [0, 1, 2, 3, 4, 5, 255, 256, 1024]) {
      const input = Uint8Array.from({ length: size }, (_, index) => (index * 37) % 256);
      const encoded = bytesToBase64(input);
      const decoded = base64ToBytes(encoded);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect(Array.from(decoded.value)).toEqual(Array.from(input));
    }
  });

  it("hasilnya sama dengan btoa untuk data biner", () => {
    expect(bytesToBase64(PNG_1PX)).toBe(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
    );
  });

  it("menolak Base64 tidak valid dan panjang bukan kelipatan 4", () => {
    expect(base64ToBytes("abc").ok).toBe(false);
    expect(base64ToBytes("a$bc").ok).toBe(false);
  });
});

describe("parseDataUrl", () => {
  it("memisahkan MIME dan isi Base64", () => {
    const parsed = parseDataUrl("data:image/png;base64,iVBORw0KGgo=");
    expect(parsed).toEqual({ ok: true, value: { mime: "image/png", base64: "iVBORw0KGgo=" } });
  });

  it("data URL non-Base64 di-encode ke Base64", () => {
    const parsed = parseDataUrl("data:text/plain,halo%20dunia");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.base64).toBe(bytesToBase64(ascii("halo dunia")));
  });

  it("menolak teks yang bukan data URL", () => {
    expect(parseDataUrl("iVBORw0KGgo=").ok).toBe(false);
  });
});

describe("readBase64Source — menerima Base64 mentah maupun data URL", () => {
  it("mendeteksi PNG dari Base64 mentah", () => {
    const result = readBase64Source(bytesToBase64(PNG_1PX));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.detected.mime).toBe("image/png");
      expect(result.value.wasDataUrl).toBe(false);
    }
  });

  it("mendeteksi PDF dari data URL", () => {
    const result = readBase64Source(`data:application/pdf;base64,${bytesToBase64(PDF_MINIMAL)}`);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.detected.kind).toBe("pdf");
      expect(result.value.wasDataUrl).toBe(true);
    }
  });

  it("menerima Base64 yang dibungkus baris baru dan tanda kutip", () => {
    const wrapped = `"${bytesToBase64(PNG_1PX).slice(0, 20)}\n${bytesToBase64(PNG_1PX).slice(20)}"`;
    const result = readBase64Source(wrapped);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.base64).toBe(bytesToBase64(PNG_1PX));
  });

  it("input kosong dan teks bukan Base64 menjadi error yang jelas", () => {
    expect(readBase64Source("   ").ok).toBe(false);
    const invalid = readBase64Source("bukan base64!");
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.message).toMatch(/bukan Base64 yang valid/i);
  });

  it("menolak teks melebihi batas", () => {
    const huge = "A".repeat(MAX_BASE64_LENGTH + 4);
    const result = readBase64Source(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("limit");
  });
});

describe("util kecil", () => {
  it("decodedByteLength memperhitungkan padding", () => {
    expect(decodedByteLength("")).toBe(0);
    expect(decodedByteLength("QQ==")).toBe(1);
    expect(decodedByteLength("QUI=")).toBe(2);
    expect(decodedByteLength("QUJD")).toBe(3);
    expect(decodedByteLength(bytesToBase64(PNG_1PX))).toBe(PNG_1PX.length);
  });

  it("formatBytes memakai satuan yang mudah dibaca", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.00 MB");
  });

  it("normalizeBase64 membuang spasi dan tanda kutip", () => {
    expect(normalizeBase64(" 'aGVs bG8=' ")).toBe("aGVsbG8=");
  });
});
