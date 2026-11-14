import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import Base64Page from "@/features/utilities/base64/Base64Page";

const textbox = (): HTMLElement => screen.getByRole("textbox");

describe("Base64Page — satu form, satu aksi", () => {
  it("Encode mengganti isi form dengan hasilnya", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(textbox());
    await user.paste("hello");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(textbox()).toHaveValue("aGVsbG8=");
  });

  it("bisa bolak-balik encode lalu decode tanpa memindahkan teks", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(textbox());
    await user.paste("café ☕");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect(textbox()).toHaveValue("Y2Fmw6kg4piV");

    await user.click(screen.getByRole("button", { name: "Decode" }));
    expect(textbox()).toHaveValue("café ☕");
  });

  it("menampilkan error untuk Base64 tidak valid", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("button", { name: "Decode" }));
    await user.click(textbox());
    await user.paste("bukan base64!");
    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan Base64/i);
  });

  it("varian urlsafe tidak memakai + atau /", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Base64Page />);
    await user.click(textbox());
    await user.paste("??>>~~");
    await user.selectOptions(screen.getByLabelText("Varian"), "urlsafe");
    await user.click(screen.getByRole("button", { name: "Encode" }));
    expect((textbox() as HTMLTextAreaElement).value).not.toMatch(/[+/]/);
    expect((textbox() as HTMLTextAreaElement).value.length).toBeGreaterThan(0);
  });

  it("hanya ada satu panel dan satu tombol salin", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<Base64Page />);
    await user.click(textbox());
    await user.paste("hello");
    expect(container.querySelectorAll(".panel")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /ke clipboard/i })).toHaveLength(1);
  });
});
