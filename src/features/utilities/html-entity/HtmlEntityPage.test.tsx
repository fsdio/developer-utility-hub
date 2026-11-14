import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import HtmlEntityPage from "@/features/utilities/html-entity/HtmlEntityPage";

describe("HtmlEntityPage — satu form, satu aksi", () => {
  it("encode mengganti isi form dengan entity", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HtmlEntityPage />);
    await user.click(screen.getByRole("textbox", { name: "HTML mentah" }));
    await user.paste("<b>&</b>");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(screen.getByRole("textbox")).toHaveValue("&lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("decode mengembalikan entity menjadi teks", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HtmlEntityPage />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await user.click(screen.getByRole("textbox", { name: /dengan entity/i }));
    await user.paste("&copy; &amp; &#39;");
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getByRole("textbox")).toHaveValue("© & '");
  });

  it("bolak-balik encode lalu decode kembali ke teks asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HtmlEntityPage />);
    await user.click(screen.getByRole("textbox", { name: "HTML mentah" }));
    await user.paste(`<a href="x">Tom & Jerry's</a>`);
    await user.click(screen.getByRole("button", { name: "Encode" }));
    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(screen.getByRole("textbox")).toHaveValue(`<a href="x">Tom & Jerry's</a>`);
  });
});
