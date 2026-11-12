import { describe, expect, it } from "vitest";
import { diffText, summarize } from "@/lib/diff/text";

describe("diffText", () => {
  it("menandai baris ditambah dan dihapus", () => {
    const result = diffText("a\nb", "a\nc\nd");
    expect(result.removed).toBe(1);
    expect(result.added).toBe(2);
    const kinds = result.lines.map((line) => line.kind);
    expect(kinds).toContain("removed");
    expect(kinds).toContain("added");
  });

  it("memasangkan blok removed/added berukuran sama sebagai modified", () => {
    const result = diffText("a\nb\nc", "a\nc\nd");
    expect(result.modified).toBe(2);
    expect(result.removed).toBe(0);
    expect(result.added).toBe(0);
  });

  it("memperlakukan blok bergeser (insert di tengah) sebagai added, bukan modified", () => {
    const result = diffText("satu\ndua\ntiga", "satu\nsisipan\ndua\ntiga");
    expect(result.added).toBe(1);
    expect(result.modified).toBe(0);
  });

  it("memasangkan baris berubah sebagai modified dengan highlight karakter", () => {
    const result = diffText("nama: Rani", "nama: Rani S.");
    const modified = result.lines.find((line) => line.kind === "modified");
    expect(modified).toBeDefined();
    expect(result.modified).toBe(1);
    expect(modified?.before).toBe("nama: Rani");
    expect(modified?.text).toBe("nama: Rani S.");
    const changedText = modified?.segments?.filter((s) => s.changed).map((s) => s.value).join("");
    expect(changedText).toBe(" S.");
  });

  it("memberi nomor baris kiri/kanan", () => {
    const result = diffText("a\nb", "a\nb");
    expect(result.lines.every((line) => line.leftNumber !== null && line.rightNumber !== null)).toBe(true);
    expect(result.lines[1]?.leftNumber).toBe(2);
  });

  it("tidak menandai apa pun untuk teks identik", () => {
    const result = diffText("sama", "sama");
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.kind).toBe("unchanged");
    expect(result.identical).toBe(true);
  });

  it("ignore case memengaruhi pembandingan, bukan teks tampilan", () => {
    const strict = diffText("Halo", "halo");
    expect(strict.modified).toBe(1);
    const loose = diffText("Halo", "halo", { ignoreCase: true });
    expect(loose.modified).toBe(0);
    expect(loose.lines[0]?.text).toBe("Halo");
  });

  it("ignore whitespace memengaruhi pembandingan", () => {
    const strict = diffText("a   b", "a b");
    expect(strict.modified).toBe(1);
    const loose = diffText("a   b", "a b", { ignoreWhitespace: true });
    expect(loose.modified).toBe(0);
  });

  it("menghasilkan unified text dengan penanda + dan -", () => {
    const result = diffText("a", "b");
    expect(result.unified).toContain("~");
    const addedOnly = diffText("a", "a\nb");
    expect(addedOnly.unified.split("\n").some((line) => line.startsWith("+b"))).toBe(true);
  });

  it("menangani input kosong di satu sisi", () => {
    const result = diffText("", "baru");
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
  });

  it("menyusun ringkasan", () => {
    const result = diffText("a", "b");
    expect(summarize(result)).toBe("+0 · -0 · ~1");
  });
});
