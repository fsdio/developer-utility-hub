import { describe, expect, it } from "vitest";
import {
  diffJson,
  diffJsonValues,
  escapePointerSegment,
  joinPointer,
  MAX_DEPTH,
  sortChanges,
} from "@/lib/diff/json";
import { patchToText, toJsonPatch } from "@/lib/diff/json-patch";

describe("pointer helpers", () => {
  it("meng-escape ~ dan / (RFC 6901)", () => {
    expect(escapePointerSegment("a~b")).toBe("a~0b");
    expect(escapePointerSegment("a/b")).toBe("a~1b");
    expect(joinPointer("", "name")).toBe("/name");
    expect(joinPointer("/users", 0)).toBe("/users/0");
  });
});

describe("diffJsonValues", () => {
  it("mengabaikan urutan key object", () => {
    const result = diffJsonValues({ a: 1, b: 2 }, { b: 2, a: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.changes).toHaveLength(0);
      expect(result.value.identical).toBe(true);
    }
  });

  it("menganggap urutan array bermakna", () => {
    const result = diffJsonValues([1, 2], [2, 1]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.changes.map((c) => c.path)).toEqual(["/0", "/1"]);
    }
  });

  it("membedakan added, removed, changed", () => {
    const result = diffJsonValues({ keep: 1, drop: 2 }, { keep: 1, add: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const kinds = result.value.changes.map((c) => `${c.kind}:${c.path}`);
      expect(kinds).toContain("removed:/drop");
      expect(kinds).toContain("added:/add");
    }
  });

  it("menandai perubahan tipe", () => {
    const result = diffJsonValues({ id: "7" }, { id: 7 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const change = result.value.changes[0];
      expect(change?.kind).toBe("changed");
      expect(change?.typeChange).toEqual({ from: "string", to: "number" });
    }
  });

  it("membedakan null dari key yang hilang", () => {
    const result = diffJsonValues({ a: null }, { a: null, b: 1 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.changes.map((c) => c.kind)).toEqual(["added"]);
  });

  it("membuat path bertingkat dengan index array", () => {
    const result = diffJsonValues(
      { users: [{ name: "A" }] },
      { users: [{ name: "B" }] },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.changes[0]?.path).toBe("/users/0/name");
  });

  it("melaporkan error kedalaman, bukan crash", () => {
    let deepLeft: unknown = 1;
    let deepRight: unknown = 2;
    for (let i = 0; i < MAX_DEPTH + 5; i += 1) {
      deepLeft = { child: deepLeft };
      deepRight = { child: deepRight };
    }
    const result = diffJsonValues(deepLeft, deepRight);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("depth");
  });
});

describe("sortChanges", () => {
  it("mengurutkan berdasarkan kedalaman lalu path", () => {
    const sorted = sortChanges([
      { path: "/b/child", kind: "added" },
      { path: "/a", kind: "removed" },
      { path: "/b", kind: "added" },
    ]);
    expect(sorted.map((c) => c.path)).toEqual(["/a", "/b", "/b/child"]);
  });
});

describe("diffJson", () => {
  it("gagal bila panel kiri tidak valid, dengan label panel", () => {
    const result = diffJson("{", "{}");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("Panel kiri");
  });

  it("gagal bila panel kanan tidak valid, dengan label panel", () => {
    const result = diffJson("{}", "nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("Panel kanan");
  });

  it("format berbeda tetapi struktur sama = tidak ada perubahan", () => {
    const result = diffJson('{"a":1,"b":[2]}', '{\n  "b": [2],\n  "a": 1\n}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.identical).toBe(true);
  });
});

describe("JSON Patch", () => {
  it("memetakan jenis change ke operasi RFC 6902", () => {
    const patch = toJsonPatch([
      { path: "/a", kind: "added", after: 1 },
      { path: "/b", kind: "removed", before: 2 },
      { path: "/c", kind: "changed", before: 3, after: 4 },
    ]);
    expect(patch).toEqual([
      { op: "add", path: "/a", value: 1 },
      { op: "remove", path: "/b" },
      { op: "replace", path: "/c", value: 4 },
    ]);
  });

  it("tidak mengeluarkan operasi di bawah parent yang dihapus", () => {
    const patch = toJsonPatch([
      { path: "/obj", kind: "removed", before: { a: 1 } },
      { path: "/obj/a", kind: "removed", before: 1 },
    ]);
    expect(patch).toEqual([{ op: "remove", path: "/obj" }]);
  });

  it("serialisasi patch sebagai JSON rapi", () => {
    const text = patchToText([{ path: "/x", kind: "added", after: true }]);
    expect(JSON.parse(text)).toEqual([{ op: "add", path: "/x", value: true }]);
  });
});
