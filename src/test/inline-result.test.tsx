import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";
import JsonDiffPage from "@/features/comparison/json-diff/JsonDiffPage";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";

/**
 * ADR-0012 — hasil harus berada di dalam panel input, bukan section di bawah
 * form. Diuji lewat struktur DOM: hasil wajib berada di dalam `.panel` yang
 * juga memuat textarea.
 */
const panelOf = (element: Element): Element | null => element.closest(".panel");

describe("hasil inline di dalam panel (ADR-0012)", () => {
  it("text diff menaruh diff di panel yang sama dengan input", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<TextDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste("a\nb");
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste("a\nc");

    const table = await screen.findByRole("table", { name: "Hasil perbandingan" });
    const input = screen.getByRole("textbox", { name: "Teks modified" });
    expect(panelOf(table)).toBe(panelOf(input));
    // Tidak ada lagi heading "Hasil perbandingan" terpisah di bawah form.
    expect(container.querySelector(".result-block")).toBeNull();
  });

  it("json diff menaruh perubahan di panel yang sama dengan input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON original" }));
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("textbox", { name: "JSON modified" }));
    await user.paste('{"a":2}');

    const table = await screen.findByRole("table");
    const input = screen.getByRole("textbox", { name: "JSON modified" });
    expect(panelOf(table)).toBe(panelOf(input));
  });

  it("json formatter menaruh output di panel yang sama dengan input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1}');

    const output = await screen.findByText((_, el) => el?.tagName === "PRE");
    const input = screen.getByRole("textbox", { name: "JSON sumber" });
    expect(panelOf(output)).toBe(panelOf(input));
  });

  it("strip hasil selalu punya label yang bisa dibaca", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1}');

    await screen.findByText((_, el) => el?.tagName === "PRE");
    const strip = screen.getByRole("region", { name: /Hasil Format/i });
    expect(within(strip).getByText("Hasil Format")).toBeInTheDocument();
  });
});
