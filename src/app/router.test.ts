import { describe, expect, it } from "vitest";
import { parseHash, toHash } from "@/app/router";

describe("parseHash", () => {
  it("memetakan beranda", () => {
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/")).toEqual({ name: "home" });
    expect(parseHash("#/tools")).toEqual({ name: "home" });
  });

  it("memetakan route tool", () => {
    expect(parseHash("#/tools/json-formatter")).toEqual({ name: "tool", id: "json-formatter" });
    expect(parseHash("#/tools/text-diff/")).toEqual({ name: "tool", id: "text-diff" });
  });

  it("memetakan filter kategori beranda", () => {
    expect(parseHash("#/?kategori=diff")).toEqual({ name: "home", category: "diff" });
  });

  it("memetakan halaman statis", () => {
    expect(parseHash("#/community")).toEqual({ name: "community" });
    expect(parseHash("#/privacy")).toEqual({ name: "privacy" });
  });

  it("mengembalikan not-found untuk path tak dikenal", () => {
    expect(parseHash("#/tidak-ada")).toEqual({ name: "not-found" });
    expect(parseHash("#/tools/Bukan-Slug!")).toEqual({ name: "not-found" });
  });

  it("tidak pernah membaca query sebagai data dokumen", () => {
    const route = parseHash("#/tools/json-formatter?data=rahasia");
    expect(route).toEqual({ name: "tool", id: "json-formatter" });
    expect(JSON.stringify(route)).not.toContain("rahasia");
  });
});

describe("toHash", () => {
  it("bolak-balik konsisten untuk route sederhana", () => {
    for (const hash of ["#/", "#/community", "#/privacy", "#/tools/case-converter"]) {
      expect(toHash(parseHash(hash))).toBe(hash);
    }
  });

  it("mempertahankan filter kategori", () => {
    expect(toHash({ name: "home", category: "diff" })).toBe("#/?kategori=diff");
  });
});
