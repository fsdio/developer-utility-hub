import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import Base64Page from "@/features/utilities/base64/Base64Page";
import NumberBasePage from "@/features/utilities/number-base/NumberBasePage";
import TimestampPage from "@/features/utilities/timestamp/TimestampPage";
import ColorPage from "@/features/utilities/color/ColorPage";
import HashPage from "@/features/utilities/hash/HashPage";

/**
 * ADR-0011 — input harus jadi elemen terpenting di panelnya.
 *
 * Tidak boleh ada teks label/hint yang terlihat mengapit input: judul panel
 * sudah memberi konteks, dan sisa teks hanya menambah kebisingan visual.
 * Nama aksesibel tetap wajib ada, dibuktikan dengan getByLabelText.
 */
/**
 * Teks label/hint yang terlihat di sekitar input. Label tersembunyi (`sr-only`)
 * tidak dihitung; `.hint-text--tight` adalah satu baris bantuan di bawah panel
 * yang memang disengaja (bukan mengapit input).
 */
const findsVisibleLabels = (container: HTMLElement): number => {
  const labels = container.querySelectorAll("label.field-label--visible");
  const hints = container.querySelectorAll(".hint-text:not(.hint-text--tight)");
  return labels.length + hints.length;
};

describe("tata letak form (ADR-0011)", () => {
  it("base64: tanpa label/hint terlihat, input tetap punya nama aksesibel", () => {
    const { container } = renderWithTheme(<Base64Page />);
    expect(findsVisibleLabels(container)).toBe(0);
    expect(screen.getByLabelText(/akan di-encode/i)).toBeInTheDocument();
  });

  it("number base: tanpa label terlihat", () => {
    const { container } = renderWithTheme(<NumberBasePage />);
    expect(findsVisibleLabels(container)).toBe(0);
    expect(screen.getByLabelText(/Angka dalam basis/i)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("timestamp: tanpa label terlihat", () => {
    const { container } = renderWithTheme(<TimestampPage />);
    expect(findsVisibleLabels(container)).toBe(0);
    expect(screen.getByLabelText(/epoch atau tanggal/i)).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("color: input teks tanpa label terlihat, hint ada untuk pembaca layar", () => {
    const { container } = renderWithTheme(<ColorPage />);
    expect(findsVisibleLabels(container)).toBe(0);
    const input = screen.getByLabelText(/Kode warna/i);
    expect(input.getAttribute("aria-describedby")).toBe("color-input-hint");
  });

  it("hash: tanpa label terlihat pada input teks", () => {
    const { container } = renderWithTheme(<HashPage />);
    expect(findsVisibleLabels(container)).toBe(0);
  });
});
