import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import ColorPage from "@/features/utilities/color/ColorPage";

describe("ColorPage", () => {
  it("mengonversi HEX ke RGB dan HSL", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ColorPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("#ff0000");
    expect(await screen.findByText("rgb(255, 0, 0)")).toBeInTheDocument();
    expect(screen.getByText("hsl(0, 100%, 50%)")).toBeInTheDocument();
  });

  it("preset mengisi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ColorPage />);
    await user.click(screen.getByRole("button", { name: /Pakai warna #10b981/i }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("#10b981");
  });

  it("menampilkan error untuk format tak dikenal", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ColorPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("merah");
    expect(await screen.findByRole("alert")).toHaveTextContent(/#rrggbb/i);
  });
});
