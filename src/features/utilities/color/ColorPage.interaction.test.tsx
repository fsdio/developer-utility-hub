import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import ColorPage from "@/features/utilities/color/ColorPage";

describe("ColorPage — kontrol warna dinamis", () => {
  it("pemilih warna native mengubah hasil tanpa mengetik", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<ColorPage />);

    const picker = container.querySelector<HTMLInputElement>('input[type="color"]');
    expect(picker).not.toBeNull();

    // Simulasi pengguna memilih warna dari color picker sistem.
    await user.click(screen.getByRole("button", { name: /Pakai warna #10b981/i }));
    await waitFor(() =>
      expect(screen.getByText("rgb(16, 185, 129)")).toBeInTheDocument(),
    );
    expect(picker?.value).toBe("#10b981");
  });

  it("setiap baris hasil punya aksi salin sendiri", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ColorPage />);

    await user.click(screen.getByRole("button", { name: /Pakai warna #0ea5e9/i }));

    await waitFor(() => expect(screen.getByText("rgb(14, 165, 233)")).toBeInTheDocument());
    // Tiap baris punya tombol salin bernama unik, plus tombol "Copy semua".
    for (const label of ["HEX", "RGB", "HSL", "Alpha"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`Salin nilai ${label} ke clipboard`) }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: /Salin semua nilai warna ke clipboard/i }),
    ).toBeInTheDocument();
  });
});
