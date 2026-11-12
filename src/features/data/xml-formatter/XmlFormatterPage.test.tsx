import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import XmlFormatterPage from "@/features/data/xml-formatter/XmlFormatterPage";

describe("XmlFormatterPage", () => {
  it("memformat XML dan mempertahankan komentar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste("<r><!--x--><a>y</a></r>");
    const output = await screen.findByText((_, element) => element?.tagName === "PRE");
    expect(output.textContent).toContain("<!--x-->");
    expect(output.textContent).toContain("<r>");
  });

  it("menampilkan error untuk XML tidak well-formed", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste("<r><a></r>");
    expect(await screen.findByRole("alert")).toHaveTextContent(/well-formed/i);
  });

  it("opsi komentar dapat dimatikan", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste("<r><!--x--><a>y</a></r>");
    await waitFor(() => expect(screen.getByText((_, el) => el?.tagName === "PRE")).toBeInTheDocument());
    await user.click(screen.getByLabelText("Pertahankan komentar"));
    await waitFor(() => {
      const output = screen.getByText((_, el) => el?.tagName === "PRE");
      expect(output.textContent).toBe("<r>\n  <a>y</a>\n</r>");
    });
  });

  it("validasi struktur menampilkan ringkasan", async () => {
    const user = userEvent.setup();
    renderWithTheme(<XmlFormatterPage />);

    await user.click(screen.getByRole("textbox", { name: "XML sumber" }));
    await user.paste("<a><b/></a>");
    await user.click(screen.getByRole("button", { name: "Validasi struktur" }));
    expect(await screen.findByText(/well-formed/)).toBeInTheDocument();
    expect(screen.getByText(/Root: <a>/)).toBeInTheDocument();
  });
});
