import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard desain (ADR-0011): UI tidak boleh memakai sudut membulat.
 * Token dan stylesheet dibaca dari disk agar regresi ketahuan tanpa browser.
 */
const root = process.cwd();
const tokensCss = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
const baseCss = readFileSync(join(root, "src/styles/base.css"), "utf8");

const radiusValues = [...tokensCss.matchAll(/--radius-[a-z]+:\s*([^;]+);/g)].map((match) =>
  (match[1] ?? "").trim(),
);

const borderRadii = [...baseCss.matchAll(/border-radius:\s*([^;]+);/g)].map((match) =>
  (match[1] ?? "").trim(),
);

describe("guard desain (ADR-0011)", () => {
  it("semua token radius bernilai 0 — tidak ada sudut membulat", () => {
    expect(radiusValues.length).toBeGreaterThan(0);
    for (const value of radiusValues) expect(value).toBe("0px");
  });

  it("tidak ada border-radius literal di stylesheet", () => {
    const offenders = borderRadii.filter(
      (value) => !value.startsWith("var(--radius-") && value !== "0",
    );
    expect(offenders).toEqual([]);
  });
});
