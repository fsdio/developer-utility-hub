import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import EscapePage from "@/features/utilities/escape/EscapePage";

describe("EscapePage", () => {
  it("escape JSON menambahkan kutip dan escape", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(screen.getByRole("textbox", { name: "Teks sumber" }));
    await user.paste('a"b');
    expect(await screen.findByText('"a\\"b"')).toBeInTheDocument();
  });

  it("SQL menggandakan kutip tunggal", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(screen.getByRole("textbox", { name: "Teks sumber" }));
    await user.paste("O'Brien");
    await user.selectOptions(screen.getByLabelText("Konteks"), "sql");
    expect(await screen.findByText("O''Brien")).toBeInTheDocument();
  });

  it("unescape JSON mengembalikan teks asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    await user.click(screen.getByRole("textbox", { name: "Teks sumber" }));
    await user.paste('"satu\\ndua"');
    await waitFor(() => {
      const output = document.querySelector(".output-area");
      expect(output?.textContent).toBe("satu\ndua");
    });
  });
});
