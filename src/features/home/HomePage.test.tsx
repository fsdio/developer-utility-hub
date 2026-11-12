import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { HomePage } from "@/features/home/HomePage";
import { TOOLS } from "@/registry/tools";

describe("HomePage", () => {
  it("menampilkan seluruh tool dan pintasan cepat", () => {
    renderWithTheme(<HomePage />);
    expect(screen.getByText(/Lima belas tool/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Paling sering dipakai/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "JSON Formatter" })).toHaveAttribute(
      "href",
      "#/tools/json-formatter",
    );
  });

  it("filter kategori mempersempit katalog", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    const utilitiesCount = TOOLS.filter((tool) => tool.category === "utilities").length;
    await user.click(screen.getByRole("button", { name: new RegExp(`Utilities \\(${utilitiesCount}\\)`) }));

    expect(screen.getByRole("link", { name: "JWT Decoder (decode saja)" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Text" })).not.toBeInTheDocument();
  });

  it("pencarian katalog menemukan tool lewat kata kunci", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    await user.type(screen.getByRole("searchbox"), "base64");

    const results = screen.getByRole("region", { name: /Hasil pencarian/i });
    expect(within(results).getByRole("link", { name: /Base64 Encode \/ Decode/i })).toBeInTheDocument();
  });

  it("pencarian tanpa hasil memberi saran, bukan halaman kosong", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    await user.type(screen.getByRole("searchbox"), "zzz-tidak-ada");

    expect(screen.getByText(/Tidak ada tool yang cocok/i)).toBeInTheDocument();
  });
});
