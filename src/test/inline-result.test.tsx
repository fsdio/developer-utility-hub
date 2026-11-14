import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";
import JsonDiffPage from "@/features/comparison/json-diff/JsonDiffPage";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";

/**
 * ADR-0012/ADR-0015 — hasil tidak boleh punya panel sendiri di bawah form.
 * Untuk tool satu-input hasilnya menggantikan isi form; untuk diff hasilnya
 * menyatu di dalam kedua panel.
 */
const panelOf = (element: Element): Element | null => element.closest(".panel");

describe("hasil inline di dalam panel (ADR-0012)", () => {
  it("text diff tidak punya panel hasil: diff menyatu di kedua form", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<TextDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste("a\nb");
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste("a\nc");

    await waitFor(() =>
      expect(screen.getByTestId("overlay-Teks modified").children.length).toBeGreaterThan(0),
    );
    expect(container.querySelectorAll(".panel")).toHaveLength(2);
    expect(container.querySelector(".inline-result")).toBeNull();
    expect(screen.queryByText(/Hasil perbandingan/i)).toBeNull();
  });

  it("json diff menaruh perubahan di panel kanan tanpa strip hasil", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<JsonDiffPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON original" }));
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("textbox", { name: "JSON modified" }));
    await user.paste('{"a":2}');

    const table = await screen.findByRole("table");
    const input = screen.getByRole("textbox", { name: "JSON modified" });
    expect(panelOf(table)).toBe(panelOf(input));
    expect(container.querySelector(".inline-result")).toBeNull();
    expect(screen.queryByText(/Menunggu input/i)).toBeNull();
  });

  it("json formatter mengubah isi form, bukan menampilkan panel hasil", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<JsonFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("button", { name: "Format" }));

    expect(screen.getByRole("textbox", { name: "JSON sumber" })).toHaveValue('{\n  "a": 1\n}');
    expect(container.querySelector(".inline-result")).toBeNull();
    expect(screen.queryByText(/Hasil Format/i)).toBeNull();
  });
});
