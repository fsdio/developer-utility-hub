import { describe, expect, it } from "vitest";
import { diffText } from "@/lib/diff/text";
import { buildDiffOverlay } from "@/lib/diff/overlay";

describe("buildDiffOverlay", () => {
  it("menandai baris dihapus di kiri dan ditambah di kanan", () => {
    const overlay = buildDiffOverlay(diffText("a\nb", "a\nc\nd"));
    expect(overlay.left.map((line) => line.kind)).toEqual(["unchanged", "removed"]);
    expect(overlay.right.map((line) => line.kind)).toEqual([
      "unchanged",
      "added",
      "added",
    ]);
  });

  it("baris berubah menyorot segmen karakter berbeda di kedua sisi", () => {
    const overlay = buildDiffOverlay(diffText("kota: Bandung", "kota: Jakarta"));
    const left = overlay.left[0];
    const right = overlay.right[0];
    expect(left?.kind).toBe("modified");
    expect(right?.kind).toBe("modified");
    expect(left?.segments?.some((segment) => segment.changed)).toBe(true);
    expect(right?.segments?.some((segment) => segment.changed)).toBe(true);
    // Teks yang tidak berubah tetap utuh saat segmen digabung.
    expect((right?.segments ?? []).map((segment) => segment.value).join("")).toBe("kota: Jakarta");
  });

  it("teks identik tidak menyorot apa pun", () => {
    const overlay = buildDiffOverlay(diffText("sama", "sama"));
    expect(overlay.left.every((line) => line.kind === "unchanged")).toBe(true);
    expect(overlay.right.every((line) => line.kind === "unchanged")).toBe(true);
  });
});
