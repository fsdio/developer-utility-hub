import { describe, expect, it } from "vitest";
import {
  escapeForFormatter,
  escapeString,
  unescapeForFormatter,
  unescapeString,
} from "@/lib/encoding/escape";

describe("escapeString", () => {
  it("JSON menghasilkan string berkutip dengan escape", () => {
    expect(escapeString('a"b\nc', "json")).toBe('"a\\"b\\nc"');
  });

  it("JavaScript meng-escape kutip tunggal dan backslash", () => {
    expect(escapeString("it's \\ here", "js")).toBe("it\\'s \\\\ here");
  });

  it("HTML memakai entity", () => {
    expect(escapeString("<b>", "html")).toBe("&lt;b&gt;");
  });

  it("SQL menggandakan kutip tunggal", () => {
    expect(escapeString("O'Brien", "sql")).toBe("O''Brien");
  });

  it("XML memakai entity XML", () => {
    expect(escapeString(`<a x="1">`, "xml")).toBe("&lt;a x=&quot;1&quot;&gt;");
  });
});

describe("unescapeString", () => {
  it("JSON round-trip", () => {
    const original = 'baris1\nbaris2 "kutip"';
    const escaped = escapeString(original, "json");
    const result = unescapeString(escaped, "json");
    expect(result.ok && result.value).toBe(original);
  });

  it("JSON menerima string tanpa kutip", () => {
    const result = unescapeString("satu\\ndua", "json");
    expect(result.ok && result.value).toBe("satu\ndua");
  });

  it("JSON menolak input yang bukan string valid", () => {
    const result = unescapeString('"belum ditutup', "json");
    expect(result.ok).toBe(false);
  });

  it("HTML round-trip", () => {
    const original = "<p>Tom & Jerry's</p>";
    const escaped = escapeString(original, "html");
    const result = unescapeString(escaped, "html");
    expect(result.ok && result.value).toBe(original);
  });

  it("SQL round-trip", () => {
    const result = unescapeString(escapeString("O'Brien", "sql"), "sql");
    expect(result.ok && result.value).toBe("O'Brien");
  });

  it("XML round-trip", () => {
    const original = `<a x="1">'&'</a>`;
    const result = unescapeString(escapeString(original, "xml"), "xml");
    expect(result.ok && result.value).toBe(original);
  });

  it("JS round-trip", () => {
    const original = "baris\nbaru 'kutip'";
    const result = unescapeString(escapeString(original, "js"), "js");
    expect(result.ok && result.value).toBe(original);
  });
});

describe("escapeForFormatter", () => {
  const PAYLOAD = 'Baris satu\nBaris "dua" & <tiga> \'empat\'';

  it("json-string menghasilkan isi string tanpa kutip", () => {
    const out = escapeForFormatter(PAYLOAD, "json-string");
    expect(out.startsWith('"')).toBe(false);
    expect(out).toContain('\\n');
    expect(JSON.parse(`"${out}"`)).toBe(PAYLOAD);
  });

  it("json-document menghasilkan dokumen JSON utuh", () => {
    const out = escapeForFormatter(PAYLOAD, "json-document");
    expect(JSON.parse(out)).toBe(PAYLOAD);
  });

  it("xml-text meng-escape lima entitas", () => {
    expect(escapeForFormatter(`<a> & "b" 'c'`, "xml-text")).toBe(
      "&lt;a&gt; &amp; &quot;b&quot; &apos;c&apos;",
    );
  });

  it("xml-document membungkus dalam elemen escaped", () => {
    expect(escapeForFormatter("<x>", "xml-document")).toBe("<escaped>&lt;x&gt;</escaped>");
  });

  it("unescape mengembalikan teks asli untuk kedua dokumen", () => {
    const jsonDoc = escapeForFormatter(PAYLOAD, "json-document");
    const xmlDoc = escapeForFormatter(PAYLOAD, "xml-document");
    expect(unescapeForFormatter(jsonDoc, "json-document")).toEqual({ ok: true, value: PAYLOAD });
    expect(unescapeForFormatter(escapeForFormatter(PAYLOAD, "json-string"), "json-string")).toEqual({
      ok: true,
      value: PAYLOAD,
    });
    // Teks tanpa escape bukan error; dikembalikan apa adanya.
    expect(unescapeForFormatter(PAYLOAD, "json-string")).toEqual({ ok: true, value: PAYLOAD });
    expect(unescapeForFormatter(xmlDoc, "xml-document")).toEqual({ ok: true, value: PAYLOAD });
    expect(unescapeForFormatter(`&lt;a&gt;`, "xml-text")).toEqual({ ok: true, value: "<a>" });
  });

  it("json-string menolak escape rusak dengan pesan yang jelas", () => {
    const result = unescapeForFormatter("satu \\u12", "json-string");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/heksadesimal/i);
    expect(unescapeForFormatter("diakhiri \\", "json-string").ok).toBe(false);
  });
});
