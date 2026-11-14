import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import ImageBase64Page from "@/features/utilities/image-base64/ImageBase64Page";

/** PNG 1×1 (67 byte) — data nyata, bukan string karangan. */
const PNG_BYTES = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  ),
  (character) => character.charCodeAt(0),
);
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

const pngFile = (): File =>
  new File([PNG_BYTES.slice().buffer], "titik.png", { type: "image/png" });

const selectFile = async (user: ReturnType<typeof userEvent.setup>, file: File): Promise<void> => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("input file tidak ditemukan");
  await user.upload(input, file);
};

const toDecode = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("button", { name: /Base64 → Berkas/i }));
};

describe("ImageBase64Page — gambar ⇄ Base64", () => {
  it("berkas gambar diubah menjadi Base64 di form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await selectFile(user, pngFile());

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /Base64 hasil konversi/i })).toHaveValue(PNG_BASE64),
    );
    expect(screen.getByText(/^PNG \d+ B → \d+ B teks Base64\.$/)).toBeInTheDocument();
  });

  it("opsi data URL menambahkan awalan data:", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await user.click(screen.getByLabelText("Sertakan data URL"));
    await selectFile(user, pngFile());

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /Base64 hasil konversi/i })).toHaveValue(
        `data:image/png;base64,${PNG_BASE64}`,
      ),
    );
  });

  it("arah kebalikan: Base64 menjadi gambar yang bisa diunduh", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    const textarea = screen.getByRole("textbox", { name: /Base64 yang akan diubah/i });
    await user.click(textarea);
    await user.paste(PNG_BASE64);

    // Pratinjau muncul...
    const preview = await screen.findByRole("img", { name: /Pratinjau PNG/i });
    expect(preview).toBeInTheDocument();
    // ...dan tombol unduh aktif.
    expect(await screen.findByRole("button", { name: "Unduh berkas" })).toBeEnabled();
  });

  it("data URL diterima di arah decode", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(`data:image/png;base64,${PNG_BASE64}`);

    expect(await screen.findByRole("img", { name: /Pratinjau PNG/i })).toBeInTheDocument();
  });

  it("Base64 yang bukan gambar ditolak dengan jelas", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    // "%PDF-1.4" dalam Base64 — valid, tetapi bukan gambar.
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste("JVBERi0xLjQK");

    // Ditolak dengan pesan jelas; pratinjau tidak pernah muncul.
    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan gambar yang didukung/i);
    expect(screen.queryByRole("img", { name: /Pratinjau/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Unduh berkas" })).toBeDisabled();
  });

  it("gambar besar punya satu tombol salin dan tidak ada panel hasil terpisah", async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(<ImageBase64Page />);
    await selectFile(user, pngFile());
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /Base64 hasil konversi/i })).not.toHaveValue(""),
    );

    expect(screen.getAllByRole("button", { name: /ke clipboard/i })).toHaveLength(1);
    expect(container.querySelector(".inline-result")).toBeNull();
  });
});
