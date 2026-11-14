import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import ApiKeyPage from "@/features/utilities/api-key/ApiKeyPage";
import { generateToken } from "@/lib/dev/auth";

describe("ApiKeyPage", () => {
  it("menghasilkan token base64url sepanjang 43 karakter", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ApiKeyPage />);

    await user.click(screen.getByRole("button", { name: "Generate" }));

    const area = screen.getByLabelText(/Token yang dihasilkan/) as HTMLTextAreaElement;
    expect(area.value).toHaveLength(43);
    expect(area.value).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(screen.getByText(/bit entropi/)).toBeInTheDocument();
  });

  it("menghormati awalan opsional", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ApiKeyPage />);

    await user.type(screen.getByLabelText(/Awalan opsional/), "sk_live_");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const area = screen.getByLabelText(/Token yang dihasilkan/) as HTMLTextAreaElement;
    expect(area.value.startsWith("sk_live_")).toBe(true);
  });

  it("menghitung sidik jari SHA-256 dari token di form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ApiKeyPage />);

    await user.click(screen.getByRole("button", { name: "Generate" }));
    const area = screen.getByLabelText(/Token yang dihasilkan/) as HTMLTextAreaElement;
    const token = area.value;

    await user.click(screen.getByRole("button", { name: "Sidik jari" }));

    await waitFor(() => expect(screen.getByText("Sidik jari SHA-256")).toBeInTheDocument());
    expect(screen.getByText(/dihitung di perangkat ini/)).toBeInTheDocument();
    // Hex yang tampil adalah hash token yang sedang ada di form.
    const expected = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const hex = Array.from(new Uint8Array(expected))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    expect(screen.getByText(hex)).toBeInTheDocument();
  });

  it("hanya ada satu tombol salin di halaman", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ApiKeyPage />);
    await user.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getAllByRole("button", { name: /^Salin / })).toHaveLength(1);
  });

  it("generateToken menolak panjang di luar batas", () => {
    expect(generateToken({ length: 0, alphabet: "hex" }).ok).toBe(false);
    expect(generateToken({ length: 513, alphabet: "hex" }).ok).toBe(false);
  });
});
