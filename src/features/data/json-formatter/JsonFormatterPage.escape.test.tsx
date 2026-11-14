import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";

const RAW = 'satu\n"dua"';

const pasteRaw = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
  await user.paste(RAW);
};

describe("JsonFormatterPage — escape", () => {
  it("Escape mengubah teks menjadi isi string JSON", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await pasteRaw(user);
    await user.click(screen.getByRole("button", { name: "Escape" }));

    expect(screen.getByRole("textbox", { name: "JSON sumber" })).toHaveValue(
      'satu\\n\\"dua\\"',
    );
  });

  it("Unescape mengembalikan teks asli", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await pasteRaw(user);
    await user.click(screen.getByRole("button", { name: "Escape" }));
    await user.click(screen.getByRole("button", { name: "Unescape" }));

    expect(screen.getByRole("textbox", { name: "JSON sumber" })).toHaveValue(RAW);
  });

  it("mode escape menampilkan pilihan bentuk, bukan indentasi", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    expect(screen.getByLabelText("Indent")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Escape" }));
    expect(screen.getByLabelText("Bentuk escape")).toBeInTheDocument();
    expect(screen.queryByLabelText("Indent")).not.toBeInTheDocument();
  });
});
