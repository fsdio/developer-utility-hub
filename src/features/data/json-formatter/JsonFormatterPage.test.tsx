import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";

describe("JsonFormatterPage", () => {
  it("memformat JSON yang valid", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1}');
    const output = await screen.findByText(/"a": 1/);
    expect(output).toBeInTheDocument();
  });

  it("menampilkan error dengan lokasi untuk JSON rusak", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a": }');
    expect(await screen.findByRole("alert")).toHaveTextContent(/JSON tidak valid di baris/i);
  });

  it("tombol validasi menampilkan ringkasan struktur", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1,"b":{"c":2}}');
    await user.click(screen.getByRole("button", { name: "Validasi" }));
    expect(await screen.findByText(/Tipe root: object/)).toBeInTheDocument();
    expect(screen.getByText(/Jumlah key: 3/)).toBeInTheDocument();
  });

  it("minify menghapus whitespace", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{\n  "a": 1\n}');
    await user.click(screen.getByRole("button", { name: "Minify" }));
    expect(await screen.findByText('{"a":1}')).toBeInTheDocument();
  });
});
