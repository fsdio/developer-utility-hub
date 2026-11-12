import { describe, expect, it } from "vitest";
import { escapeString, unescapeString } from "@/lib/encoding/escape";

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
