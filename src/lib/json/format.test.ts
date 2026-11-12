import { describe, expect, it } from "vitest";
import {
  errorExcerpt,
  formatJson,
  minifyJson,
  offsetToLineColumn,
  parseJson,
  validateJson,
} from "@/lib/json/format";

const SOURCE = `{
  "name": "devkit",
  "tools": ["json", "xml"],
  "meta": { "version": 2 }
}`;

describe("parseJson", () => {
  it("menerima JSON valid", () => {
    const result = parseJson('{"a":1}');
    expect(result.ok).toBe(true);
  });

  it("menolak input kosong dengan pesan yang jelas", () => {
    const result = parseJson("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("kosong");
  });

  it("melaporkan baris dan kolom untuk error", () => {
    const result = parseJson('{\n  "a": 1,\n  "b": ,\n}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("parse");
      expect(result.error.line).toBe(3);
      expect(result.error.message).toContain("baris 3");
      expect(result.error.detail).toContain("^");
    }
  });
});

describe("offsetToLineColumn", () => {
  it("menghitung posisi 1-based", () => {
    expect(offsetToLineColumn("abc", 0)).toEqual({ line: 1, column: 1 });
    expect(offsetToLineColumn("a\nbc", 2)).toEqual({ line: 2, column: 1 });
    expect(offsetToLineColumn("a\nbc", 3)).toEqual({ line: 2, column: 2 });
  });

  it("mengklamp offset di luar rentang", () => {
    expect(offsetToLineColumn("abc", 99)).toEqual({ line: 1, column: 4 });
  });
});

describe("errorExcerpt", () => {
  it("menandai baris target dengan > dan ^", () => {
    const excerpt = errorExcerpt("a\nb\nc", 2, 1);
    expect(excerpt).toContain("> 2 | b");
    expect(excerpt).toContain("^");
  });
});

describe("formatJson", () => {
  it("beautify dengan indent 2", () => {
    const result = formatJson('{"a":{"b":1}}', 2);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toBe('{\n  "a": {\n    "b": 1\n  }\n}');
  });

  it("beautify dengan indent 4 dan tab", () => {
    const four = formatJson('{"a":1}', 4);
    expect(four.ok && four.value.text).toBe('{\n    "a": 1\n}');
    const tab = formatJson('{"a":1}', "tab");
    expect(tab.ok && tab.value.text).toBe('{\n\t"a": 1\n}');
  });

  it("menghitung statistik struktur", () => {
    const result = formatJson(SOURCE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.stats.rootType).toBe("object");
      expect(result.value.stats.keys).toBe(4);
    }
  });

  it("meneruskan error parse tanpa melempar exception", () => {
    const result = formatJson("{oops}");
    expect(result.ok).toBe(false);
  });
});

describe("minifyJson", () => {
  it("menghapus semua whitespace struktural", () => {
    const result = minifyJson(SOURCE);
    expect(result.ok && result.value.text).toBe(
      '{"name":"devkit","tools":["json","xml"],"meta":{"version":2}}',
    );
  });
});

describe("validateJson", () => {
  it("mengembalikan statistik untuk JSON valid", () => {
    const result = validateJson("[1,2,3]");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.rootType).toBe("array");
  });

  it("mengembalikan error untuk JSON tidak valid", () => {
    expect(validateJson("{").ok).toBe(false);
  });
});
