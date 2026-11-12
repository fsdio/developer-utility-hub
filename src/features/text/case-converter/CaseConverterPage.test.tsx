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

describe("CaseConverterPage", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  it("menampilkan empty state saat input kosong", () => {
    renderWithTheme(<CaseConverterPage />);
    expect(screen.getByText(/Masukkan teks untuk melihat/i)).toBeInTheDocument();
  });

  it("mengonversi input ke sembilan gaya", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.type(screen.getByLabelText("Teks sumber"), "HTTPResponse");
    expect(await screen.findByLabelText("camelCase")).toHaveTextContent("httpResponse");
    expect(screen.getByLabelText("snake_case")).toHaveTextContent("http_response");
    expect(screen.getByLabelText("CONSTANT_CASE")).toHaveTextContent("HTTP_RESPONSE");
  });

  it("tombol contoh mengisi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.click(screen.getByRole("button", { name: /Coba contoh/i }));
    expect(screen.getByLabelText("Teks sumber")).toHaveValue(
      "Hello, World! userID from HTTPResponse",
    );
  });

  it("copy menyalin hasil satu gaya saja", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderWithTheme(<CaseConverterPage />);

    await user.type(screen.getByLabelText("Teks sumber"), "hello world");
    const camelItem = (await screen.findByLabelText("camelCase")).closest(".case-item");
    expect(camelItem).not.toBeNull();
    const copyButton = camelItem!.querySelector("button");
    expect(copyButton).not.toBeNull();
    await user.click(copyButton!);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("helloWorld"));
  });

  it("reset mengosongkan input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);

    await user.type(screen.getByLabelText("Teks sumber"), "hello");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("Teks sumber")).toHaveValue("");
  });
});
