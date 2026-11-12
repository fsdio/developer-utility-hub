import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import UuidPage from "@/features/utilities/uuid/UuidPage";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("UuidPage", () => {
  it("membuat UUID v4 secara otomatis saat dibuka", async () => {
    renderWithTheme(<UuidPage />);
    const codes = await screen.findAllByText(UUID_RE);
    expect(codes).toHaveLength(5);
    expect(codes[0]?.textContent?.[14]).toBe("4");
  });

  it("mengganti jumlah UUID", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UuidPage />);
    await screen.findAllByText(UUID_RE);
    await user.selectOptions(screen.getByLabelText("Jumlah"), "10");
    await waitFor(async () => {
      expect(await screen.findAllByText(UUID_RE)).toHaveLength(10);
    });
  });

  it("versi 7 menyandikan versi yang benar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UuidPage />);
    await screen.findAllByText(UUID_RE);
    await user.selectOptions(screen.getByLabelText("Versi"), "7");
    const codes = await screen.findAllByText(UUID_RE);
    expect(codes[0]?.textContent?.[14]).toBe("7");
  });

  it("menyebut sumber acak yang dipakai", async () => {
    renderWithTheme(<UuidPage />);
    await screen.findAllByText(UUID_RE);
    expect(screen.getByText(/Sumber acak:/i)).toBeInTheDocument();
  });
});
