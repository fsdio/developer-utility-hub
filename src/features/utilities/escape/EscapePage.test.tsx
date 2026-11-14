import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import EscapePage from "@/features/utilities/escape/EscapePage";

const textbox = (): HTMLElement => screen.getByRole("textbox");

describe("EscapePage — satu form, satu aksi", () => {
  it("escape JSON menambahkan kutip dan escape ke isi form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(textbox());
    await user.paste('a"b');
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(textbox()).toHaveValue('"a\\"b"');
  });

  it("konteks SQL menggandakan kutip tunggal", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(textbox());
    await user.paste("O'Brien");
    await user.selectOptions(screen.getByLabelText("Konteks"), "sql");
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(textbox()).toHaveValue("O''Brien");
  });

  it("unescape mengembalikan teks asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    await user.click(textbox());
    await user.paste('"satu\\ndua"');
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    expect(textbox()).toHaveValue("satu\ndua");
  });

  it("escape lalu unescape bisa dirangkai di form yang sama", async () => {
    const user = userEvent.setup();
    renderWithTheme(<EscapePage />);
    await user.click(textbox());
    await user.paste("satu dua");
    await user.click(screen.getByRole("button", { name: "Escape" }));
    await user.click(screen.getByRole("button", { name: "Unescape" }));
    expect(textbox()).toHaveValue("satu dua");
  });
});
