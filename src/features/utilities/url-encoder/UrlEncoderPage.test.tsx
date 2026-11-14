import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import UrlEncoderPage from "@/features/utilities/url-encoder/UrlEncoderPage";

describe("UrlEncoderPage", () => {
  it("encode query string", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UrlEncoderPage />);
    await user.click(screen.getByRole("textbox", { name: /akan di-encode/i }));
    await user.paste("a b&c");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(screen.getByRole("textbox")).toHaveValue("a%20b%26c");
  });

  it("menampilkan error untuk escape tidak lengkap", async () => {
    const user = userEvent.setup();
    renderWithTheme(<UrlEncoderPage />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await user.click(screen.getByRole("textbox", { name: /akan di-decode/i }));
    await user.paste("abc%2");
    expect(await screen.findByRole("alert")).toHaveTextContent(/posisi/i);
  });
});
