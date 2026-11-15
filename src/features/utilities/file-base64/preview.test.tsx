import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import ImageBase64Page from "@/features/utilities/image-base64/ImageBase64Page";
import PdfBase64Page from "@/features/utilities/pdf-base64/PdfBase64Page";
import {
  PREVIEW_INLINE_LIMIT,
  previewModeFor,
  type DetectedFile,
} from "@/lib/encoding/file-base64";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
const PDF_BASE64 =
  "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyA+PgplbmRvYmoKdHJhaWxlcgo8PD4+CiUlRU9GCg==";

const PNG: DetectedFile = { kind: "image", mime: "image/png", extension: "png", label: "PNG" };
const PDF: DetectedFile = { kind: "pdf", mime: "application/pdf", extension: "pdf", label: "PDF" };
const FONT: DetectedFile = { kind: "font", mime: "font/woff2", extension: "woff2", label: "WOFF2" };

const toDecode = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole("button", { name: /Base64 → Berkas/i }));
};

describe("previewModeFor", () => {
  it("menampilkan gambar dan PDF berukuran wajar secara inline", () => {
    expect(previewModeFor(PNG, 1024)).toBe("inline");
    expect(previewModeFor(PDF, 1024)).toBe("inline");
  });

  it("menahan pratinjau di atas batas ukuran", () => {
    expect(previewModeFor(PNG, PREVIEW_INLINE_LIMIT + 1)).toBe("too-large");
  });

  it("menandai jenis yang tidak bisa dirender browser", () => {
    expect(previewModeFor(FONT, 1024)).toBe("unsupported");
  });

  it("menandai berkas yang belum terbaca", () => {
    expect(previewModeFor(null, 0)).toBe("failed");
  });
});

describe("pratinjau gambar", () => {
  it("memakai data URL lokal, bukan blob URL", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(URL, "createObjectURL");
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PNG_BASE64);

    const preview = await screen.findByRole("img", { name: /Pratinjau PNG/i });
    expect(preview.getAttribute("src")).toBe(`data:image/png;base64,${PNG_BASE64}`);
    // Tidak ada blob URL yang dibuat untuk pratinjau.
    expect(createSpy).not.toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it("tidak memanggil fetch saat menyiapkan pratinjau", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PNG_BASE64);
    await screen.findByRole("img", { name: /Pratinjau PNG/i });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("menampilkan pratinjau setelah jeda debounce saat menempel Base64", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ImageBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PNG_BASE64);

    await waitFor(() => expect(screen.getByRole("img", { name: /Pratinjau PNG/i })).toBeInTheDocument());
  });
});

describe("pratinjau PDF", () => {
  it("memakai data URL agar tetap lokal tanpa jaringan", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);

    await toDecode(user);
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste(PDF_BASE64);

    await waitFor(() => {
      const preview = document.querySelector("object.file-preview--pdf");
      expect(preview?.getAttribute("data")).toBe(`data:application/pdf;base64,${PDF_BASE64}`);
    });
  });

  it("memberi penjelasan, bukan pratinjau kosong, saat jenis tidak didukung", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PdfBase64Page />);

    await toDecode(user);
    // WOFF2 di tool PDF ditolak sebagai jenis yang salah; pastikan pesannya jelas.
    await user.click(screen.getByRole("textbox", { name: /Base64 yang akan diubah/i }));
    await user.paste("d09GMgABAAAAAA==");

    expect(await screen.findByRole("alert")).toHaveTextContent(/bukan PDF/i);
  });
});
