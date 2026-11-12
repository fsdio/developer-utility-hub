import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import HtmlEntityPage from "@/features/utilities/html-entity/HtmlEntityPage";

describe("HtmlEntityPage", () => {
  it("encode karakter berbahaya", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HtmlEntityPage />);
    await user.click(screen.getByRole("textbox", { name: "HTML mentah" }));
    await user.paste("<b>&</b>");
    expect(await screen.findByText("&lt;b&gt;&amp;&lt;/b&gt;")).toBeInTheDocument();
  });

  it("decode entity kembali ke teks", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HtmlEntityPage />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await user.click(screen.getByRole("textbox", { name: /dengan entity/i }));
    await user.paste("&copy; &amp; &#39;");
    expect(await screen.findByText("© & '")).toBeInTheDocument();
  });
});
