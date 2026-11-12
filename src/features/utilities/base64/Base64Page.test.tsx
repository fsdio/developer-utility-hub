import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import Base64Page from "@/features/utilities/base64/Base64Page";

describe("Base64Page", () => {
  it("encode teks ASCII", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("textbox", { name: /akan di-encode/i }));
    await user.paste("hello");
    expect(await screen.findByText("aGVsbG8=")).toBeInTheDocument();
  });

  it("encode UTF-8 lalu decode kembali lewat tombol tukar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("textbox", { name: /akan di-encode/i }));
    await user.paste("café ☕");
    const encoded = await screen.findByText("Y2Fmw6kg4piV");
    expect(encoded).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tukar ke decode/i }));
    expect(await screen.findByText("café ☕")).toBeInTheDocument();
  });

  it("menampilkan error untuk Base64 tidak valid", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste("bukan base64!");
    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan Base64/i);
  });

  it("varian urlsafe tidak memakai + atau /", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("textbox", { name: /akan di-encode/i }));
    await user.paste("??>>~~");
    await user.selectOptions(screen.getByLabelText("Varian"), "urlsafe");
    await waitFor(() => {
      const output = document.querySelector(".output-area");
      expect(output?.textContent).not.toMatch(/[+/]/);
    });
  });
});
