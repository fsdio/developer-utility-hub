import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import CaseConverterPage from "@/features/text/case-converter/CaseConverterPage";

const stubClipboard = (writeText: (text: string) => Promise<void>): void => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
};

const textbox = (): HTMLElement => screen.getByRole("textbox");

describe("CaseConverterPage — satu form, satu aksi", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  it("memakai satu form, bukan panel hasil terpisah", () => {
    const { container } = renderWithTheme(<CaseConverterPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(container.querySelectorAll(".panel")).toHaveLength(1);
  });

  it("tombol gaya mengubah isi form di tempat", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.type(textbox(), "HTTPResponse");
    await user.click(screen.getByRole("button", { name: "snake_case" }));
    expect(textbox()).toHaveValue("http_response");

    await user.click(screen.getByRole("button", { name: "CONSTANT_CASE" }));
    expect(textbox()).toHaveValue("HTTP_RESPONSE");
  });

  it("gaya bisa dirangkai karena hasil masuk kembali ke form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.type(textbox(), "hello world");
    await user.click(screen.getByRole("button", { name: "camelCase" }));
    expect(textbox()).toHaveValue("helloWorld");

    await user.click(screen.getByRole("button", { name: "kebab-case" }));
    expect(textbox()).toHaveValue("hello-world");
  });

  it("hanya ada SATU tombol salin di halaman", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);
    await user.type(textbox(), "hello world");

    expect(screen.getAllByRole("button", { name: /ke clipboard/i })).toHaveLength(1);
  });

  it("tombol salin menyalin isi form apa adanya", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderWithTheme(<CaseConverterPage />);

    await user.type(textbox(), "hello world");
    await user.click(screen.getByRole("button", { name: "camelCase" }));
    await user.click(screen.getByRole("button", { name: /ke clipboard/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("helloWorld"));
  });

  it("tombol contoh mengisi form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.click(screen.getByRole("button", { name: /coba contoh/i }));
    expect(textbox()).toHaveValue("Hello, World! userID from HTTPResponse");
  });

  it("reset mengosongkan form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.type(textbox(), "hello");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(textbox()).toHaveValue("");
  });
});
