import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import XmlFormatterPage from "@/features/data/xml-formatter/XmlFormatterPage";

const RAW = `<a href="x">Tom & Jerry</a>`;

describe("XmlFormatterPage — escape", () => {
  it("Escape mengubah karakter berbahaya menjadi entitas XML", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste(RAW);
    await user.click(screen.getByRole("button", { name: "Escape" }));

    const output = await screen.findByText((_, el) => el?.tagName === "PRE");
    expect(output.textContent).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;");
  });

  it("Unescape mengembalikan teks asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste(RAW);
    await user.click(screen.getByRole("button", { name: "Escape" }));
    await user.click(screen.getByRole("button", { name: "Unescape" }));

    const output = await screen.findByText((_, el) => el?.tagName === "PRE");
    expect(output.textContent).toBe(RAW);
  });

  it("mode escape menyembunyikan opsi formatter yang tidak relevan", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);
    expect(screen.getByLabelText("Pertahankan komentar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(screen.getByLabelText("Bentuk escape")).toBeInTheDocument();
    expect(screen.queryByLabelText("Pertahankan komentar")).not.toBeInTheDocument();
  });
});
