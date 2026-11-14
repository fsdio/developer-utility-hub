import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";

const textbox = (): HTMLElement => screen.getByRole("textbox", { name: "JSON sumber" });

describe("JsonFormatterPage — hasil masuk ke form (ADR-0015)", () => {
  it("Format mengganti isi form dengan JSON terformat", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(textbox());
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("button", { name: "Format" }));

    expect(textbox()).toHaveValue('{\n  "a": 1\n}');
    // Tidak ada panel/heading "Hasil Format" terpisah di halaman.
    expect(screen.queryByText(/Hasil Format/)).toBeNull();
  });

  it("menampilkan error dengan lokasi untuk JSON rusak", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(textbox());
    await user.paste('{"a": }');
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/JSON tidak valid di baris/i);
  });

  it("Validasi melaporkan ringkasan tanpa mengubah isi form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    const raw = '{"a":1,"b":{"c":2}}';
    await user.click(textbox());
    await user.paste(raw);
    await user.click(screen.getByRole("button", { name: "Validasi" }));

    expect(await screen.findByText(/Tipe root: object/)).toBeInTheDocument();
    expect(screen.getByText(/Jumlah key: 3/)).toBeInTheDocument();
    expect(textbox()).toHaveValue(raw);
  });

  it("Minify lalu Format bisa dirangkai di form yang sama", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(textbox());
    await user.paste('{\n  "a": 1\n}');
    await user.click(screen.getByRole("button", { name: "Minify" }));
    expect(textbox()).toHaveValue('{"a":1}');

    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(textbox()).toHaveValue('{\n  "a": 1\n}');
  });

  it("Escape lalu Unescape mengembalikan isi asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(textbox());
    await user.paste('a"b');
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(textbox()).toHaveValue('a\\"b');

    await user.click(screen.getByRole("button", { name: "Unescape" }));
    expect(textbox()).toHaveValue('a"b');
  });
});
