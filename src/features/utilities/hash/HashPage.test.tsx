import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import HashPage from "@/features/utilities/hash/HashPage";

const SHA256_HELLO =
  "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";

describe("HashPage", () => {
  it("menghitung SHA-256 setelah debounce", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HashPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-hash/i }));
    await user.paste("hello world");
    await waitFor(() => expect(screen.getByText(SHA256_HELLO)).toBeInTheDocument(), { timeout: 3000 });
  });

  it("mengganti algoritma mengubah panjang digest", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HashPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-hash/i }));
    await user.paste("abc");
    await waitFor(() => expect(screen.getByText(/SHA-256 · 256 bit/)).toBeInTheDocument(), { timeout: 3000 });
    await user.selectOptions(screen.getByLabelText("Algoritma"), "SHA-512");
    await waitFor(() => expect(screen.getByText(/SHA-512 · 512 bit/)).toBeInTheDocument(), { timeout: 3000 });
  });

  it("menampilkan base64 dari digest", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HashPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-hash/i }));
    await user.paste("hello world");
    await waitFor(
      () => expect(screen.getByText("uU0nuZNNPgilLlLX2n2r+sSE7+N6U4DukIj3rOLvzek=")).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});
