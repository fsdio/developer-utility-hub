import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { StoragePage } from "@/features/storage/StoragePage";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

describe("StoragePage — kelola penyimpanan", () => {
  it("menampilkan preferensi yang tersimpan beserta ukurannya", async () => {
    localStorage.setItem(PREFERENCE_KEYS.theme, "dark");
    renderWithTheme(<StoragePage />);

    expect(await screen.findByText("Tema terang/gelap/sistem")).toBeInTheDocument();
    expect(screen.getByText(/1 kunci/)).toBeInTheDocument();
  });

  it("menghapus preferensi hanya setelah tombol ditekan", async () => {
    const user = userEvent.setup();
    localStorage.setItem(PREFERENCE_KEYS.jsonIndent, "2");
    localStorage.setItem("milik-situs-lain", "tetap");

    renderWithTheme(<StoragePage />);
    await waitFor(() => expect(screen.getByText("Indentasi JSON Formatter")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Hapus preferensi" }));

    await waitFor(() => expect(screen.getByText(/Preferensi dihapus/)).toBeInTheDocument());
    expect(localStorage.getItem(PREFERENCE_KEYS.jsonIndent)).toBeNull();
    // Kunci situs lain tidak disentuh.
    expect(localStorage.getItem("milik-situs-lain")).toBe("tetap");
  });

  it("melaporkan kunci situs lain tanpa menawarkan untuk menghapusnya", async () => {
    localStorage.setItem("milik-situs-lain", "1");
    renderWithTheme(<StoragePage />);

    expect(await screen.findByText(/1 kunci lain di origin ini bukan milik aplikasi/)).toBeInTheDocument();
  });

  it("memberi pesan jelas saat cache dan service worker tidak tersedia", async () => {
    const user = userEvent.setup();
    renderWithTheme(<StoragePage />);
    await screen.findByText("Ringkasan");

    // Tombol cache nonaktif karena jsdom tidak punya Cache Storage.
    expect(screen.getByRole("button", { name: "Hapus cache offline" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Lepas service worker" }));
    expect(await screen.findByText(/tidak memakai service worker/i)).toBeInTheDocument();
  });

  it("menghapus cache setelah laporan menyebutkan cache yang ada", async () => {
    const user = userEvent.setup();
    const deleted: string[] = [];
    vi.stubGlobal("caches", {
      keys: async () => ["duh-shell-v2"],
      delete: async (name: string) => {
        deleted.push(name);
        return true;
      },
      open: async () => ({ keys: async () => [] }),
    });

    renderWithTheme(<StoragePage />);
    await waitFor(() => expect(screen.getByText(/1 cache/)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Hapus cache offline" }));

    await waitFor(() => expect(screen.getByText(/cache dihapus/)).toBeInTheDocument());
    expect(deleted).toEqual(["duh-shell-v2"]);
    vi.unstubAllGlobals();
  });

  it("tidak pernah mengirim data ke jaringan saat memuat laporan", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderWithTheme(<StoragePage />);
    await screen.findByText("Ringkasan");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
