import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_KEY_PREFIX,
  clearAppPreferences,
  clearCacheStorage,
  collectStorageReport,
  labelForKey,
  preferenceBytes,
  unregisterServiceWorker,
  utf8Bytes,
} from "@/lib/browser/storage-report";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("utf8Bytes", () => {
  it("menghitung byte UTF-8, bukan jumlah karakter", () => {
    expect(utf8Bytes("abc")).toBe(3);
    expect(utf8Bytes("é")).toBe(2);
    expect(utf8Bytes("☕")).toBe(3);
  });
});

describe("labelForKey", () => {
  it("memakai nama manusia yang sama dengan halaman Privasi", () => {
    expect(labelForKey(PREFERENCE_KEYS.theme)).toBe("Tema terang/gelap/sistem");
    expect(labelForKey(PREFERENCE_KEYS.recentTools)).toMatch(/terakhir dibuka/i);
  });

  it("jatuh ke kunci mentah untuk kunci tak dikenal", () => {
    expect(labelForKey("duh:tidak-dikenal")).toBe("duh:tidak-dikenal");
  });
});

describe("collectStorageReport", () => {
  it("melaporkan hanya kunci milik aplikasi, bukan milik situs lain", async () => {
    localStorage.setItem(PREFERENCE_KEYS.theme, "dark");
    localStorage.setItem("kunci-situs-lain", "rahasia");

    const report = await collectStorageReport();

    expect(report.supported).toBe(true);
    expect(report.local.map((entry) => entry.key)).toEqual([PREFERENCE_KEYS.theme]);
    expect(report.local[0]?.label).toBe("Tema terang/gelap/sistem");
    expect(report.local[0]?.bytes).toBeGreaterThan(0);
    expect(report.foreignKeys).toEqual(["kunci-situs-lain"]);
  });

  it("memisahkan sessionStorage dan menghitung total byte preferensi", async () => {
    localStorage.setItem(PREFERENCE_KEYS.jsonIndent, "2");
    sessionStorage.setItem(`${APP_KEY_PREFIX}reload-guard`, "abc");

    const report = await collectStorageReport();

    expect(report.local).toHaveLength(1);
    expect(report.session).toHaveLength(1);
    expect(preferenceBytes(report)).toBe(
      (report.local[0]?.bytes ?? 0) + (report.session[0]?.bytes ?? 0),
    );
  });

  it("tidak pernah menampilkan isi input — hanya preferensi", async () => {
    localStorage.setItem(PREFERENCE_KEYS.recentTools, JSON.stringify(["json-formatter"]));
    const report = await collectStorageReport();

    expect(report.local[0]?.value).toContain("json-formatter");
    expect(report.local[0]?.value).not.toContain("rahasia");
  });

  it("melaporkan kuota bila peramban menyediakannya", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      storage: { estimate: async () => ({ usage: 2048, quota: 1048576 }) },
    });

    const report = await collectStorageReport();

    expect(report.usage).toBe(2048);
    expect(report.quota).toBe(1048576);
    vi.unstubAllGlobals();
  });

  it("tetap mengembalikan laporan saat estimate gagal", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      storage: {
        estimate: async () => {
          throw new Error("ditolak");
        },
      },
    });

    const report = await collectStorageReport();

    expect(report.usage).toBeNull();
    expect(report.quota).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe("clearAppPreferences", () => {
  it("menghapus kunci duh: saja dan tidak menyentuh kunci situs lain", () => {
    localStorage.setItem(PREFERENCE_KEYS.theme, "dark");
    localStorage.setItem(PREFERENCE_KEYS.recentTools, "[]");
    localStorage.setItem("kunci-situs-lain", "tetap");
    sessionStorage.setItem(`${APP_KEY_PREFIX}reload-guard`, "abc");

    const result = clearAppPreferences();

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/Preferensi dihapus \(3 kunci\)/);
    expect(localStorage.getItem(PREFERENCE_KEYS.theme)).toBeNull();
    expect(localStorage.getItem("kunci-situs-lain")).toBe("tetap");
    expect(sessionStorage.getItem(`${APP_KEY_PREFIX}reload-guard`)).toBeNull();
  });
});

describe("cache & service worker", () => {
  it("tidak gagal bila Cache Storage tidak tersedia", async () => {
    const result = await clearCacheStorage();
    // jsdom tidak menyediakan `caches`: hasilnya harus berupa pesan, bukan lemparan.
    expect(typeof result.message).toBe("string");
    expect(result.scope).toBe("caches");
  });

  it("tidak gagal bila service worker tidak tersedia", async () => {
    const result = await unregisterServiceWorker();
    expect(result.scope).toBe("serviceWorker");
    expect(result.ok).toBe(false);
  });

  it("menghapus seluruh cache origin saat tersedia", async () => {
    const deleted: string[] = [];
    vi.stubGlobal("caches", {
      keys: async () => ["duh-shell-v2", "lain"],
      delete: async (name: string) => {
        deleted.push(name);
        return true;
      },
    });

    const result = await clearCacheStorage();

    expect(result.ok).toBe(true);
    expect(deleted).toEqual(["duh-shell-v2", "lain"]);
    vi.unstubAllGlobals();
  });

  it("melepas semua registrasi service worker", async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations: async () => [{ unregister }, { unregister }] },
    });

    const result = await unregisterServiceWorker();

    expect(result.ok).toBe(true);
    expect(unregister).toHaveBeenCalledTimes(2);
  });
});
