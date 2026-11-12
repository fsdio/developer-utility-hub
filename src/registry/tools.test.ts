import { describe, expect, it } from "vitest";
import { CATEGORY_ORDER, getTool, searchTools, TOOLS, toolsByCategory } from "@/registry/tools";

describe("registry", () => {
  it("berisi lima tool MVP", () => {
    expect(TOOLS).toHaveLength(5);
    expect(TOOLS.map((tool) => tool.id)).toEqual([
      "case-converter",
      "json-formatter",
      "xml-formatter",
      "text-diff",
      "json-diff",
    ]);
  });

  it("setiap tool punya metadata lengkap dan unik", () => {
    const ids = new Set<string>();
    const routes = new Set<string>();
    for (const tool of TOOLS) {
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.keywords.length).toBeGreaterThan(0);
      expect(tool.limitations.length).toBeGreaterThan(0);
      expect(typeof tool.load).toBe("function");
      expect(ids.has(tool.id)).toBe(false);
      expect(routes.has(tool.route)).toBe(false);
      ids.add(tool.id);
      routes.add(tool.route);
    }
  });

  it("route sesuai pola hash dan id", () => {
    for (const tool of TOOLS) expect(tool.route).toBe(`#/tools/${tool.id}`);
  });

  it("kategori mengikuti urutan tetap dan tanpa grup kosong", () => {
    const groups = toolsByCategory();
    const order = groups.map((group) => group.category);
    expect(order).toEqual(CATEGORY_ORDER.filter((category) => order.includes(category)));
    expect(groups.every((group) => group.tools.length > 0)).toBe(true);
  });

  it("getTool menemukan id yang ada dan undefined untuk yang tidak ada", () => {
    expect(getTool("json-diff")?.name).toBe("JSON Diff");
    expect(getTool("tidak-ada")).toBeUndefined();
  });
});

describe("searchTools", () => {
  it("mengembalikan semua tool untuk query kosong", () => {
    expect(searchTools("")).toHaveLength(TOOLS.length);
  });

  it("mengutamakan tool yang namanya diawali query", () => {
    const results = searchTools("json");
    expect(results.slice(0, 2).map((tool) => tool.id)).toEqual(["json-diff", "json-formatter"]);
  });

  it("mencocokkan kata kunci", () => {
    expect(searchTools("snake").map((tool) => tool.id)).toContain("case-converter");
    expect(searchTools("beautify").map((tool) => tool.id)).toContain("xml-formatter");
  });

  it("tidak menemukan apa pun untuk query asing", () => {
    expect(searchTools("zzz-tidak-ada")).toHaveLength(0);
  });

  it("case-insensitive", () => {
    expect(searchTools("JSON")).toEqual(searchTools("json"));
  });
});
