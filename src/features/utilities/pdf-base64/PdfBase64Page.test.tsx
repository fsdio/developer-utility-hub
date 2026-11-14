import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import PdfBase64Page from "@/features/utilities/pdf-base64/PdfBase64Page";

const PDF_TEXT = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n";
const PDF_BYTES = new TextEncoder().encode(PDF_TEXT);
/** Base64 dari PDF_TEXT di atas. */
const PDF_BASE64 =
  "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyA+PgplbmRvYmoKdHJhaWxlcgo8PD4+CiUlRU9GCg==";

const pdfFile = (): File => new File([PDF_BYTES.slice().buffer], "laporan.pdf", { type: "application/pdf" });

const selectFile = async (user: ReturnType<typeof userEvent.setup>, file: File): Promise<void> => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("input file tidak ditemukan");
  await user.upload(input, file);
};

const toDecode = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("button", { name: /Base64 → Berkas/i }));
};

describe("PdfBase64Page — PDF ⇄ Base64", () => {
  it("berkas PDF diubah menjadi Base64", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);

    await selectFile(user, pdfFile());

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /Base64 hasil konversi/i })).toHaveValue(PDF_BASE64),
    );
    // Footer menyebut jenis dan ukuran, bukan nama berkas karangan.
    expect(screen.getByText(/^laporan\.pdf · /)).toBeInTheDocument();
  });

  it("arah kebalikan: Base64 menjadi PDF yang bisa diunduh", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PDF_BASE64);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Unduh berkas" })).toBeEnabled(),
    );
    // Pratinjau memakai <object> berisi blob URL PDF.
    const preview = document.querySelector("object.file-preview--pdf");
    expect(preview).not.toBeNull();
    expect(preview?.getAttribute("type")).toBe("application/pdf");
    expect(screen.getByText(/PDF .* siap diunduh/i)).toBeInTheDocument();
  });

  it("tombol unduh memakai createObjectURL dan mengunduh berkas PDF", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-pdf");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderWithTheme(<PdfBase64Page />);
    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PDF_BASE64);
    await waitFor(() => expect(screen.getByRole("button", { name: "Unduh berkas" })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "Unduh berkas" }));
    expect(createSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(screen.getByText(/\.pdf diunduh\./)).toBeInTheDocument();

    createSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("gambar ditolak saat dipilih di tool PDF", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWithTheme(<PdfBase64Page />);

    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "gambar.png", { type: "image/png" });
    await selectFile(user, png);

    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan PDF/i);
    expect(screen.getByRole("textbox", { name: /Base64 hasil konversi/i })).toHaveValue("");
  });

  it("Base64 bukan PDF ditolak di arah decode", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste("aGVsbG8gd29ybGQ=");

    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan PDF/i);
  });

  it("teks kosong tidak menampilkan error dan unduhan nonaktif", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);
    await toDecode(user);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Unduh berkas" })).toBeDisabled();
  });
});
