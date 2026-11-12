import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";

describe("TextDiffPage", () => {
  it("menampilkan empty state saat salah satu panel kosong", () => {
    renderWithTheme(<TextDiffPage />);
    expect(screen.getByText(/Isi kedua panel untuk melihat perbedaan/i)).toBeInTheDocument();
  });

  it("menampilkan ringkasan dan baris diff", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste("a\nb");
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste("a\nc\nd");

    await waitFor(() => expect(screen.getByText(/ditambah/)).toBeInTheDocument());
    expect(screen.getByRole("table", { name: "Hasil perbandingan" })).toBeInTheDocument();
  });

  it("tukar panel menukar isi kedua textarea", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste("kiri");
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste("kanan");

    await user.click(screen.getByRole("button", { name: "Tukar panel" }));
    expect(screen.getByRole("textbox", { name: "Teks original" })).toHaveValue("kanan");
    expect(screen.getByRole("textbox", { name: "Teks modified" })).toHaveValue("kiri");
  });

  it("opsi ignore case mengubah hasil", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste("Halo");
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste("halo");

    await waitFor(() => expect(screen.getByText(/~1 diubah/)).toBeInTheDocument());
    await user.click(screen.getByLabelText("Ignore case"));
    await waitFor(() => expect(screen.getByText(/~0 diubah/)).toBeInTheDocument());
  });
});
