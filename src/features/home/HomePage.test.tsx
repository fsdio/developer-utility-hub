import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { HomePage } from "@/features/home/HomePage";
import { TOOLS } from "@/registry/tools";

describe("HomePage", () => {
  it("menampilkan seluruh tool dan pintasan cepat", () => {
    renderWithTheme(<HomePage />);
    expect(screen.getByText(new RegExp(`${TOOLS.length} tool`))).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Paling sering dipakai/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "JSON Formatter" })).toHaveAttribute(
      "href",
      "#/tools/json-formatter",
    );
  });

  it("filter kategori mempersempit katalog", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    const authCount = TOOLS.filter((tool) => tool.category === "auth").length;
    await user.click(screen.getByRole("button", { name: new RegExp(`Auth & Token \\(${authCount}\\)`) }));

    const catalog = screen.getByRole("region", { name: /^Auth & Token/ });
    expect(within(catalog).getByRole("link", { name: /JWT Verifier/ })).toBeInTheDocument();
    expect(within(catalog).getByRole("link", { name: /API Key Generator/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^Teks/ })).not.toBeInTheDocument();
  });

  it("pencarian katalog menemukan tool lewat kata kunci", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    await user.type(screen.getByRole("searchbox"), "base64");

    const results = screen.getByRole("region", { name: /Hasil pencarian/i });
    expect(within(results).getByRole("link", { name: /Base64 Encode \/ Decode/i })).toBeInTheDocument();
  });

  it("katalog berupa daftar baris, bukan grid kartu", () => {
    renderWithTheme(<HomePage />);

    expect(screen.getAllByRole("list").length).toBeGreaterThan(0);
    expect(document.querySelector(".card-grid")).toBeNull();
    expect(document.querySelectorAll(".tool-row").length).toBeGreaterThanOrEqual(TOOLS.length);
  });

  it("grup kategori bisa dilipat tanpa kehilangan tautan tool", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    const toggles = screen.getAllByRole("button", { name: "Lipat" });
    expect(toggles.length).toBeGreaterThan(0);

    await user.click(toggles[0]!);
    expect(document.querySelectorAll(".tool-list[hidden]").length).toBe(1);
    expect(screen.getByRole("button", { name: "Buka" })).toBeInTheDocument();
  });

  it("pencarian tanpa hasil memberi saran, bukan halaman kosong", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomePage />);

    await user.type(screen.getByRole("searchbox"), "zzz-tidak-ada");

    expect(screen.getByText(/Tidak ada tool yang cocok/i)).toBeInTheDocument();
  });
});
