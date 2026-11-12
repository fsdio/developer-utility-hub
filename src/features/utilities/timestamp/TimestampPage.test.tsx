import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import TimestampPage from "@/features/utilities/timestamp/TimestampPage";

describe("TimestampPage", () => {
  it("menampilkan semua representasi epoch", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TimestampPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("1700000000");
    expect(await screen.findByText("2023-11-14T22:13:20.000Z")).toBeInTheDocument();
    expect(screen.getByText("2023-11-14 22:13:20 UTC")).toBeInTheDocument();
    expect(screen.getByText("1700000000000")).toBeInTheDocument();
  });

  it("menampilkan error untuk tanggal mustahil", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TimestampPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("2026-02-30T00:00:00Z");
    expect(await screen.findByRole("alert")).toHaveTextContent(/Tanggal tidak valid/i);
  });

  it("tombol sekarang mengisi epoch detik", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TimestampPage />);
    await user.click(screen.getByRole("button", { name: /Isi dengan sekarang/i }));
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(Number(input.value)).toBeGreaterThan(1_600_000_000);
  });
});
