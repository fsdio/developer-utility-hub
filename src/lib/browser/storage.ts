/**
 * Wrapper localStorage: gagal secara senyap dan jatuh ke memori.
 * Hanya preferensi yang boleh lewat sini — TIDAK PERNAH isi input (PRD §3).
 * `recentTools` hanya menyimpan id tool publik (bukan judul/nama file), sehingga
 * tidak dapat mengungkap isi pekerjaan pengguna.
 */

export const PREFERENCE_KEYS = {
  theme: "duh:v1:theme",
  caseConverterStyle: "duh:v1:case-converter:style",
  jsonIndent: "duh:v1:json-formatter:indent",
  xmlOptions: "duh:v1:xml-formatter:options",
  textDiffOptions: "duh:v1:text-diff:options",
  recentTools: "duh:v1:recent-tools",
  /** ID build yang terakhir dipakai; dipakai offline mode (ADR-0013). */
  buildVersion: "duh:v1:build-version",
} as const;

export type PreferenceKey = (typeof PREFERENCE_KEYS)[keyof typeof PREFERENCE_KEYS];

const memory = new Map<string, string>();

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const probe = "duh:probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function readPreference(key: PreferenceKey): string | null {
  const storage = safeStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  }
  return memory.get(key) ?? null;
}

export function writePreference(key: PreferenceKey, value: string): void {
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // jatuh ke memori
    }
  }
  memory.set(key, value);
}

export function removePreference(key: PreferenceKey): void {
  const storage = safeStorage();
  try {
    storage?.removeItem(key);
  } catch {
    // abaikan
  }
  memory.delete(key);
}

export function clearAllPreferences(): void {
  for (const key of Object.values(PREFERENCE_KEYS)) removePreference(key);
}
