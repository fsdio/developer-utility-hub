import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import NumberBasePage from "@/features/utilities/number-base/NumberBasePage";

describe("NumberBasePage", () => {
  it("desimal ke semua basis", async () => {
    const user = userEvent.setup();
    renderWithTheme(<NumberBasePage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("255");
    expect(await screen.findByText("11111111")).toBeInTheDocument();
    expect(screen.getByText("ff")).toBeInTheDocument();
    expect(screen.getByText("8 bit")).toBeInTheDocument();
  });

  it("heksadesimal dibaca sesuai basis", async () => {
    const user = userEvent.setup();
    renderWithTheme(<NumberBasePage />);
    await user.selectOptions(screen.getByLabelText("Basis input"), "16");
    await user.click(screen.getByRole("textbox"));
    await user.paste("0xFF");
    expect(await screen.findByText("255")).toBeInTheDocument();
  });

  it("menolak digit di luar basis", async () => {
    const user = userEvent.setup();
    renderWithTheme(<NumberBasePage />);
    await user.selectOptions(screen.getByLabelText("Basis input"), "2");
    await user.click(screen.getByRole("textbox"));
    await user.paste("102");
    expect(await screen.findByRole("alert")).toHaveTextContent(/0, 1/);
  });
});
