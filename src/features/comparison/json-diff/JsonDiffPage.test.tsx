import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import JsonDiffPage from "@/features/comparison/json-diff/JsonDiffPage";

const fill = async (user: ReturnType<typeof userEvent.setup>, name: string, text: string) => {
  await user.click(screen.getByRole("textbox", { name }));
  await user.paste(text);
};

describe("JsonDiffPage", () => {
  it("menampilkan perubahan per path", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonDiffPage />);

    await fill(user, "JSON original", '{"name":"lama","id":1}');
    await fill(user, "JSON modified", '{"name":"baru","id":1,"aktif":true}');

    await waitFor(() => expect(screen.getByText("/name")).toBeInTheDocument());
    expect(screen.getByText("/aktif")).toBeInTheDocument();
    expect(screen.getByText("added")).toBeInTheDocument();
  });

  it("mengabaikan urutan key", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonDiffPage />);

    await fill(user, "JSON original", '{"a":1,"b":2}');
    await fill(user, "JSON modified", '{"b":2,"a":1}');

    expect(
      await screen.findByText(/Kedua dokumen identik secara struktur/i),
    ).toBeInTheDocument();
  });

  it("menampilkan error bila salah satu JSON tidak valid", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonDiffPage />);

    await fill(user, "JSON original", "{");
    await fill(user, "JSON modified", "{}");

    expect(await screen.findByRole("alert")).toHaveTextContent(/Panel kiri/);
  });

  it("tampilan patch menghasilkan JSON Patch RFC 6902", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonDiffPage />);

    await fill(user, "JSON original", '{"a":1}');
    await fill(user, "JSON modified", '{"a":2}');
    await user.click(screen.getByRole("button", { name: "Tampilan patch" }));

    expect(await screen.findByText(/"op": "replace"/)).toBeInTheDocument();
    expect(screen.getByText(/"path": "\/a"/)).toBeInTheDocument();
  });
});
