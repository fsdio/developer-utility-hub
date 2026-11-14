import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";

const original = (): HTMLElement => screen.getByRole("textbox", { name: "Teks original" });
const modified = (): HTMLElement => screen.getByRole("textbox", { name: "Teks modified" });

const overlayOf = (label: string): HTMLElement =>
  screen.getByTestId(`overlay-${label}`);

describe("TextDiffPage — diff di dalam kedua form (ADR-0015)", () => {
  it("hanya ada dua panel dan tidak ada panel hasil", () => {
    const { container } = renderWithTheme(<TextDiffPage />);
    expect(container.querySelectorAll(".panel")).toHaveLength(2);
    expect(container.querySelector(".inline-result")).toBeNull();
    expect(screen.queryByText(/Hasil perbandingan/i)).toBeNull();
  });

  it("menampilkan ringkasan di kaki panel Modified", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(original());
    await user.paste("a\nb");
    await user.click(modified());
    await user.paste("a\nc\nd");

    // Ringkasan ada di footer panel Modified dan diumumkan lewat aria-live.
    const summary = await screen.findByText(/^\+\d+ −\d+ ~\d+$/);
    expect(summary.closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });

  it("menyorot baris berbeda langsung di masing-masing form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(original());
    await user.paste("a\nb");
    await user.click(modified());
    await user.paste("a\nc\nd");

    await waitFor(() => {
      // Blok added/removed berukuran berbeda → tampil sebagai baris tambah/hapus.
      expect(overlayOf("Teks modified").querySelectorAll(".diff-line--added")).toHaveLength(2);
      expect(overlayOf("Teks original").querySelectorAll(".diff-line--removed")).toHaveLength(1);
    });
    // Form tetap bisa diedit: teksnya adalah teks asli, bukan hasil diff.
    expect(modified()).toHaveValue("a\nc\nd");
  });

  it("penanda karakter hanya pada bagian yang berubah", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(original());
    await user.paste("kota: Bandung");
    await user.click(modified());
    await user.paste("kota: Jakarta");

    await waitFor(() => {
      const marks = within(overlayOf("Teks modified")).getAllByText(/.+/, { selector: "mark" });
      expect(marks.length).toBeGreaterThan(0);
    });
  });

  it("tukar panel menukar isi kedua textarea", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(original());
    await user.paste("kiri");
    await user.click(modified());
    await user.paste("kanan");

    await user.click(screen.getByRole("button", { name: "Tukar panel" }));
    expect(original()).toHaveValue("kanan");
    expect(modified()).toHaveValue("kiri");
  });

  it("opsi ignore case mengubah hasil", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(original());
    await user.paste("Halo");
    await user.click(modified());
    await user.paste("halo");

    await waitFor(() => expect(screen.getByText(/~1/)).toBeInTheDocument());
    await user.click(screen.getByLabelText("Ignore case"));
    await waitFor(() => expect(screen.getByText(/~0/)).toBeInTheDocument());
  });
});
