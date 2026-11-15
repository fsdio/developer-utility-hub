/**
 * Inventaris penyimpanan browser untuk situs ini (ADR-0022).
 *
 * Modul ini **hanya membaca**; penghapusan dilakukan fungsi `clear*` di berkas
 * yang sama supaya halaman tidak perlu tahu detail `localStorage`/Cache API.
 * Tidak ada `fetch`: laporan disusun dari API browser yang sudah ada.
 */
import { APP_STORAGE_KEYS, PREFERENCE_KEYS, PREFERENCE_LABELS, type PreferenceKey } from "@/lib/browser/storage";

/** Prefix milik aplikasi; kunci lain di origin yang sama tidak pernah disentuh. */
export const APP_KEY_PREFIX = "duh:";

export interface KeyEntry {
  key: string;
  /** Nama manusia; jatuh ke kunci mentah bila tidak dikenal. */
  label: string;
  bytes: number;
  /** Cuplikan nilai untuk pemeriksaan cepat (tanpa isi input — memang tidak ada). */
  value: string;
}

export interface CacheEntry {
  name: string;
  entries: number;
}

export interface StorageReport {
  /** `localStorage` bisa dipakai di peramban ini. */
  supported: boolean;
  /** Origin yang datanya sedang dihitung. */
  origin: string;
  local: KeyEntry[];
  session: KeyEntry[];
  /** Kunci lain di origin yang sama; hanya dilaporkan, tidak dihapus. */
  foreignKeys: string[];
  caches: CacheEntry[];
  /** Perkiraan byte yang dipakai situs ini (localStorage + cache). */
  usage: number | null;
  quota: number | null;
}

const encoder = new TextEncoder();

/** Panjang UTF-8, bukan jumlah karakter — supaya byte yang tampil jujur. */
export const utf8Bytes = (text: string): number => encoder.encode(text).length;

const isAppKey = (key: string): boolean => key.startsWith(APP_KEY_PREFIX);

export const labelForKey = (key: string): string =>
  (PREFERENCE_LABELS as Record<string, string | undefined>)[key] ?? key;

const snapshot = (storage: Storage): Array<{ key: string; value: string }> => {
  const items: Array<{ key: string; value: string }> = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key === null) continue;
    items.push({ key, value: storage.getItem(key) ?? "" });
  }
  return items;
};

const clip = (value: string, limit = 60): string =>
  value.length <= limit ? value : `${value.slice(0, limit)}…`;

const getStorage = (kind: "local" | "session"): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    const storage = kind === "local" ? window.localStorage : window.sessionStorage;
    // Peramban bisa melempar SecurityError saat cookie diblokir.
    const probe = `${APP_KEY_PREFIX}probe`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
};

const readCaches = async (): Promise<CacheEntry[]> => {
  try {
    if (typeof caches === "undefined") return [];
    const names = await caches.keys();
    return await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        return { name, entries: (await cache.keys()).length };
      }),
    );
  } catch {
    return [];
  }
};

const readEstimate = async (): Promise<{ usage: number | null; quota: number | null }> => {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
      return { usage: null, quota: null };
    }
    const { usage, quota } = await navigator.storage.estimate();
    return { usage: usage ?? null, quota: quota ?? null };
  } catch {
    return { usage: null, quota: null };
  }
};

/** Membaca semua data yang bisa dilihat situs ini. Tidak mengubah apa pun. */
export async function collectStorageReport(): Promise<StorageReport> {
  const local = getStorage("local");
  const session = getStorage("session");
  const localItems = local ? snapshot(local) : [];
  const sessionItems = session ? snapshot(session) : [];

  const toEntry = (item: { key: string; value: string }): KeyEntry => ({
    key: item.key,
    label: labelForKey(item.key),
    bytes: utf8Bytes(item.key) + utf8Bytes(item.value),
    value: clip(item.value),
  });

  const estimate = await readEstimate();

  return {
    supported: local !== null,
    origin: typeof window === "undefined" ? "" : window.location.origin,
    local: localItems.filter((item) => isAppKey(item.key)).map(toEntry),
    session: sessionItems.filter((item) => isAppKey(item.key)).map(toEntry),
    foreignKeys: localItems.filter((item) => !isAppKey(item.key)).map((item) => item.key),
    caches: await readCaches(),
    usage: estimate.usage,
    quota: estimate.quota,
  };
}

/** Byte yang bisa dibebaskan dari preferensi aplikasi (localStorage + session). */
export const preferenceBytes = (report: StorageReport): number =>
  [...report.local, ...report.session].reduce((total, entry) => total + entry.bytes, 0);

export type ClearScope = "preferences" | "caches" | "serviceWorker";

export interface ClearResult {
  scope: ClearScope;
  ok: boolean;
  /** Keterangan singkat untuk pesan status. */
  message: string;
}

/** Menghapus preferensi aplikasi saja (kunci `duh:`), bukan data situs lain. */
export function clearAppPreferences(): ClearResult {
  let removed = 0;
  for (const kind of ["local", "session"] as const) {
    const storage = getStorage(kind);
    if (!storage) continue;
    for (const key of snapshot(storage)) {
      if (!isAppKey(key.key)) continue;
      try {
        storage.removeItem(key.key);
        removed += 1;
      } catch {
        // abaikan: sebagian peramban menolak saat mode privat.
      }
    }
  }
  return {
    scope: "preferences",
    ok: true,
    message: `Preferensi dihapus (${removed} kunci). Tema dan pilihan tool kembali ke bawaan.`,
  };
}

/** Menghapus semua Cache Storage milik origin ini. Unduhan/cache kembali kosong. */
export async function clearCacheStorage(): Promise<ClearResult> {
  try {
    if (typeof caches === "undefined") {
      return { scope: "caches", ok: false, message: "Browser ini tidak memakai Cache Storage." };
    }
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    return {
      scope: "caches",
      ok: true,
      message:
        names.length === 0
          ? "Tidak ada cache yang perlu dihapus."
          : `${names.length} cache dihapus. Build berikutnya akan diunduh ulang.`,
    };
  } catch {
    return { scope: "caches", ok: false, message: "Cache tidak bisa dihapus dari halaman ini." };
  }
}

/**
 * Melepas service worker. Pendaftaran dihapus supaya build baru tidak disajikan
 * dari cache lama; mode offline mati sampai halaman dimuat ulang.
 */
export async function unregisterServiceWorker(): Promise<ClearResult> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return { scope: "serviceWorker", ok: false, message: "Browser ini tidak memakai service worker." };
    }
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    return {
      scope: "serviceWorker",
      ok: true,
      message:
        registrations.length === 0
          ? "Tidak ada service worker yang aktif."
          : "Service worker dilepas. Muat ulang halaman agar mode offline terpasang lagi.",
    };
  } catch {
    return {
      scope: "serviceWorker",
      ok: false,
      message: "Service worker tidak bisa dilepas dari halaman ini.",
    };
  }
}

/** Kunci preferensi yang memang dikelola aplikasi (untuk ditampilkan). */
export const MANAGED_KEYS: readonly PreferenceKey[] = APP_STORAGE_KEYS;

/** Dipakai halaman Privasi untuk menandai kunci yang tidak boleh hilang. */
export const BUILD_KEY = PREFERENCE_KEYS.buildVersion;
