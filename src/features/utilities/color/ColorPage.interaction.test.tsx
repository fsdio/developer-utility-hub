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

  it("hanya ada satu tombol salin untuk semua nilai warna", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ColorPage />);

    await user.click(screen.getByRole("button", { name: /Pakai warna #0ea5e9/i }));
    await waitFor(() => expect(screen.getByText("rgb(14, 165, 233)")).toBeInTheDocument());

    const copyButtons = screen.getAllByRole("button", { name: /ke clipboard/i });
    expect(copyButtons).toHaveLength(1);
    expect(copyButtons[0]).toHaveAccessibleName(/semua nilai warna/i);
  });
});
