import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import XmlFormatterPage from "@/features/data/xml-formatter/XmlFormatterPage";

const textbox = (): HTMLElement => screen.getByRole("textbox", { name: "XML sumber" });

describe("XmlFormatterPage — hasil masuk ke form (ADR-0015)", () => {
  it("Format mengganti isi form dan mempertahankan komentar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(textbox());
    await user.paste("<r><!--x--><a>y</a></r>");
    await user.click(screen.getByRole("button", { name: "Format" }));

    const value = (textbox() as HTMLTextAreaElement).value;
    expect(value).toContain("<!--x-->");
    expect(value.startsWith("<r>")).toBe(true);
    expect(value.endsWith("</r>")).toBe(true);
    expect(screen.queryByText(/Hasil Format/)).toBeNull();
  });

  it("menampilkan error untuk XML tidak well-formed", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(textbox());
    await user.paste("<r><a></r>");
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/well-formed/i);
  });

  it("opsi komentar dapat dimatikan sebelum memformat", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(textbox());
    await user.paste("<r><!--x--><a>y</a></r>");
    await user.click(screen.getByLabelText("Pertahankan komentar"));
    await user.click(screen.getByRole("button", { name: "Format" }));

    expect((textbox() as HTMLTextAreaElement).value).toBe("<r>\n  <a>y</a>\n</r>");
  });

  it("Validasi struktur melaporkan ringkasan tanpa mengubah isi form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(textbox());
    await user.paste("<a><b/></a>");
    await user.click(screen.getByRole("button", { name: "Validasi struktur" }));

    expect(await screen.findByText(/well-formed/)).toBeInTheDocument();
    expect(screen.getByText(/root <a>/i)).toBeInTheDocument();
    expect(textbox()).toHaveValue("<a><b/></a>");
  });
});
