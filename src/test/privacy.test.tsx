import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import CaseConverterPage from "@/features/text/case-converter/CaseConverterPage";
import JsonFormatterPage from "@/features/data/json-formatter/JsonFormatterPage";
import TextDiffPage from "@/features/comparison/text-diff/TextDiffPage";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";
import Base64Page from "@/features/utilities/base64/Base64Page";
import TimestampPage from "@/features/utilities/timestamp/TimestampPage";
import UuidPage from "@/features/utilities/uuid/UuidPage";
import ColorPage from "@/features/utilities/color/ColorPage";

/**
 * Audit privasi (technical-design §11): isi input tidak boleh masuk ke
 * storage maupun ke jaringan.
 */
const SECRET = "isi-rahasia-pengguna-42";

const allStorageValues = (): string[] => {
  const collect = (storage: Storage): string[] => {
    const values: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key === null) continue;
      values.push(key, storage.getItem(key) ?? "");
    }
    return values;
  };
  return [...collect(localStorage), ...collect(sessionStorage)];
};

const expectAllStorageClean = (): void => {
  for (const value of allStorageValues()) {
    expect(value).not.toMatch(/1700000000|#2563eb/);
  }
};

const expectNoSecret = (): void => {
  for (const value of allStorageValues()) {
    expect(value).not.toContain(SECRET);
  }
  expect(window.location.hash).not.toContain(SECRET);
};

describe("audit privasi", () => {
  it("case converter tidak menyimpan isi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);
    await user.type(screen.getByRole("textbox"), SECRET);
    await user.click(screen.getByRole("button", { name: "snake_case" }));
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue("isi_rahasia_pengguna_42"));
    expectNoSecret();
  });

  it("json formatter tidak menyimpan isi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste(`{"kunci":"${SECRET}"}`);
    await user.click(screen.getByRole("button", { name: "Format" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "JSON sumber" })).toHaveValue(
        `{\n  "kunci": "${SECRET}"\n}`,
      ),
    );
    expectNoSecret();
  });

  it("text diff tidak menyimpan isi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TextDiffPage />);
    await user.click(screen.getByRole("textbox", { name: "Teks original" }));
    await user.paste(SECRET);
    await user.click(screen.getByRole("textbox", { name: "Teks modified" }));
    await user.paste(`${SECRET}-berubah`);
    await waitFor(() =>
      expect(screen.getByTestId("overlay-Teks modified").children.length).toBeGreaterThan(0),
    );
    expectNoSecret();
  });

  it("tool Phase 5 tidak menyimpan isi input", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithTheme(<Base64Page />);
    await user.click(screen.getByRole("textbox", { name: /akan di-encode/i }));
    await user.paste(SECRET);
    await user.click(screen.getByRole("button", { name: "Encode" }));
    await waitFor(() => expect(screen.getByRole("textbox")).not.toHaveValue(SECRET));
    expectNoSecret();
    unmount();

    const timestamp = renderWithTheme(<TimestampPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("1700000000");
    await waitFor(() => expect(screen.getByText("2023-11-14T22:13:20.000Z")).toBeInTheDocument());
    expectAllStorageClean();
    timestamp.unmount();

    renderWithTheme(<ColorPage />);
    await user.click(screen.getByRole("textbox"));
    await user.paste("#2563eb");
    await waitFor(() => expect(document.querySelector(".swatch")).not.toBeNull());
    expectAllStorageClean();
  });

  it("UUID generator tidak menyimpan UUID yang dihasilkan", async () => {
    renderWithTheme(<UuidPage />);
    const codes = await screen.findAllByText(/^[0-9a-f-]{36}$/);
    const firstUuid = codes[0]?.textContent ?? "";
    expect(firstUuid.length).toBe(36);

    const storageDump = allStorageValues().join("|");
    expect(storageDump).not.toContain(firstUuid);
    expect(window.location.hash).not.toContain(firstUuid);
  });

  it("riwayat tool hanya menyimpan id tool, bukan isi input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste(`{"kunci":"${SECRET}"}`);
    await waitFor(() => expect(localStorage.getItem(PREFERENCE_KEYS.recentTools)).toContain("json-formatter"));

    const stored = localStorage.getItem(PREFERENCE_KEYS.recentTools);
    expect(stored).not.toBeNull();
    expect(stored).toContain("json-formatter");
    expect(stored).not.toContain(SECRET);
    expect(stored).not.toContain("kunci");
  });

  it("preferensi yang disimpan hanya kunci tampilan yang terdaftar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<JsonFormatterPage />);
    await user.click(screen.getByRole("textbox", { name: "JSON sumber" }));
    await user.paste('{"a":1}');
    await user.click(screen.getByRole("button", { name: "Format" }));
    expect(screen.getByRole("textbox", { name: "JSON sumber" })).toHaveValue('{\n  "a": 1\n}');

    const allowed = new Set(Object.values(PREFERENCE_KEYS));
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) expect(allowed.has(key as never)).toBe(true);
    }
  });

  it("tidak ada permintaan jaringan saat tool dipakai", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const xhrOpen = vi.spyOn(XMLHttpRequest.prototype, "open");

    const user = userEvent.setup();
    renderWithTheme(<CaseConverterPage />);
    await user.type(screen.getByRole("textbox"), SECRET);
    await user.click(screen.getByRole("button", { name: "snake_case" }));
    await waitFor(() => expect(screen.getByRole("textbox")).not.toHaveValue(""));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    xhrOpen.mockRestore();
  });
});
