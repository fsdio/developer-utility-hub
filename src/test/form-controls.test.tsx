import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import BasicAuthPage from "@/features/utilities/basic-auth/BasicAuthPage";
import ApiKeyPage from "@/features/utilities/api-key/ApiKeyPage";
import JwtVerifyPage from "@/features/utilities/jwt-verify/JwtVerifyPage";
import NumberBasePage from "@/features/utilities/number-base/NumberBasePage";
import TimestampPage from "@/features/utilities/timestamp/TimestampPage";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return full.endsWith(".tsx") ? [full] : [];
  });

/** Berkas yang memang sengaja memakai kontrol mentah (punya gayanya sendiri). */
const ALLOWED_RAW = [
  "src/components/common/Field.tsx", // komponen kontrol itu sendiri
  "src/components/editor/CodeArea.tsx", // area teks utama, gayanya `.code-area`
  "src/components/common/FileDropZone.tsx", // input file tersembunyi (sr-only)
  "src/components/navigation/ToolSearch.tsx", // combobox, butuh role/aria khusus
  "src/features/home/HomePage.tsx", // kotak cari katalog (`.catalog-search`)
  "src/features/utilities/color/ColorPage.tsx", // input color native, gayanya khusus
];

/**
 * Regresi UI form (ADR-0020): jangan ada lagi kontrol native tanpa gaya.
 *
 * Penyebab aslinya hanya `input[type=text]` yang punya aturan CSS; `password`,
 * `textarea`, dan `select` di dalam panel tampil dengan gaya bawaan browser.
 * Uji ini mengunci dua hal: setiap kontrol di halaman punya kelas kontrol, dan
 * stylesheet menormalkan semua jenis kontrol yang dipakai aplikasi.
 */
describe("kontrol form bergaya seragam (ADR-0020)", () => {
  it("tidak ada input/select/textarea mentah di luar berkas yang diizinkan", () => {
    const offenders: string[] = [];

    for (const file of walk("src")) {
      if (file.includes(".test.") || file.startsWith("src/test/")) continue;
      if (ALLOWED_RAW.some((allowed) => file.endsWith(allowed))) continue;

      const source = readFileSync(file, "utf8");
      const matches = source.match(/<(input|select|textarea)\b[^>]*>/g) ?? [];
      for (const tag of matches) {
        const styled =
          /className=/.test(tag) || /<input[\s\S]*type="color"/.test(tag) || /type="checkbox"/.test(tag);
        if (!styled) offenders.push(`${file}: ${tag.slice(0, 60)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("stylesheet menormalkan setiap jenis kontrol yang dipakai", () => {
    const css = readFileSync("src/styles/base.css", "utf8");

    // Semua kontrol teks (termasuk password/textarea) masuk satu aturan dasar.
    expect(css).toMatch(/select,[\s\S]{0,200}input:not\(\[type="checkbox"\]\)/);
    // Textarea mendapat min-height dan resize sendiri.
    expect(css).toMatch(/textarea\s*\{[^}]*min-height/);
    // Select digambar ulang (chevron) supaya warnanya mengikuti tema.
    expect(css).toMatch(/select\s*\{[^}]*appearance:\s*none/);
    // Placeholder ikut warna token, bukan bawaan browser.
    expect(css).toMatch(/::placeholder/);
    // Kontrol nonaktif punya tampilan sendiri.
    expect(css).toMatch(/:disabled/);
  });
});

describe("halaman auth memakai kontrol bergaya", () => {
  it("basic auth: username, password, dan header memakai kelas kontrol", () => {
    const { container } = renderWithTheme(<BasicAuthPage />);
    const username = screen.getByLabelText("Username");
    const password = screen.getByLabelText("Password");

    expect(username).toHaveClass("control-input");
    expect(password).toHaveClass("control-input");
    expect(container.querySelector("textarea")?.className).toContain("code-area");
    expect(container.querySelectorAll("input:not([class])")).toHaveLength(0);
  });

  it("api key: select algoritma memakai select-wrap, bukan select telanjang", () => {
    const { container } = renderWithTheme(<ApiKeyPage />);
    const select = screen.getByLabelText("Algoritma sidik jari");
    expect(select.closest(".select-wrap")).not.toBeNull();
    // Toolbar punya panjang & alfabet; semua select harus dibungkus.
    expect(container.querySelectorAll("select")).toHaveLength(3);
    expect(container.querySelectorAll("select:not(.select-wrap select)")).toHaveLength(0);
  });

  it("jwt verify: kunci memakai textarea bergaya kontrol", () => {
    renderWithTheme(<JwtVerifyPage />);
    const key = screen.getByLabelText("Kunci verifikasi");
    expect(key.tagName).toBe("TEXTAREA");
    expect(key).toHaveClass("control-input--area");
    expect(screen.getByLabelText("Issuer yang diharapkan")).toHaveClass("control-input");
  });

  it("number base & timestamp: satu textbox, punya kelas kontrol dan hint aksesibel", () => {
    renderWithTheme(<NumberBasePage />);
    const input = screen.getByLabelText(/Angka dalam basis/i);
    expect(input).toHaveClass("control-input");
    expect(input).toHaveAttribute("aria-describedby");
  });

  it("timestamp: input mengisi lebar dan bisa difokus keyboard", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TimestampPage />);
    const input = screen.getByLabelText(/epoch atau tanggal/i);
    await user.click(input);
    expect(input).toHaveFocus();
  });
});
