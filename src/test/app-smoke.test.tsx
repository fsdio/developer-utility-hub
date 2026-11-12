import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { App } from "@/app/App";

const setHash = (hash: string): void => {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};

describe("App (smoke)", () => {
  it("merender beranda dengan header, katalog, dan footer", async () => {
    window.location.hash = "";
    renderWithTheme(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Utility developer/i }),
    ).toBeInTheDocument();
    const github = screen.getByRole("link", { name: "GitHub" });
    expect(github).toHaveAttribute("href", expect.stringContaining("github.com"));
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("menavigasi ke tool lewat katalog dan memuat chunk-nya", async () => {
    window.location.hash = "";
    const user = userEvent.setup();
    renderWithTheme(<App />);

    await user.click(screen.getByRole("link", { name: /Case Converter/ }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Case Converter" }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe("#/tools/case-converter");
    expect(document.title).toContain("Case Converter");
  });

  it("menampilkan 404 untuk route tak dikenal", async () => {
    renderWithTheme(<App />);
    setHash("#/tools/tidak-ada");

    expect(
      await screen.findByRole("heading", { level: 1, name: /Halaman tidak ditemukan/i }),
    ).toBeInTheDocument();
  });

  it("pencarian tool menavigasi ke hasil", async () => {
    window.location.hash = "";
    const user = userEvent.setup();
    renderWithTheme(<App />);

    const search = screen.getByRole("combobox", { name: /Cari tool/i });
    await user.click(search);
    await user.type(search, "diff");
    const option = await screen.findByRole("option", { name: /Text Diff/ });
    await user.click(within(option).getByRole("link"));

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "Text Diff" })).toBeInTheDocument(),
    );
  });
});
