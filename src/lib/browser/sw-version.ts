/**
 * Alamat versi build (ADR-0013).
 *
 * Berkas kecil yang selalu ditulis ulang setiap build. Service worker tidak
 * menyimpan berkas ini di cache, sehingga klien bisa menanyakannya ke server
 * hanya sekali per sesi untuk menentukan apakah aset di cache masih berlaku.
 */
export const VERSION_PATH = "version.json";

export interface BuildVersion {
  /** ID penentu: berubah bila isi build berubah. */
  id: string;
  builtAt: string;
}

const isBuildVersion = (value: unknown): value is BuildVersion => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && record.id !== "" && typeof record.builtAt === "string";
};

export function parseVersionJson(raw: string): BuildVersion | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isBuildVersion(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export type VersionDecision = "up-to-date" | "update" | "unknown";

/**
 * Membandingkan versi server dengan versi yang terakhir dipakai.
 *
 * - `up-to-date` : id sama  → pakai cache browser, tidak ada reload.
 * - `update`     : id beda atau belum pernah ada → muat ulang dari server.
 * - `unknown`    : respons tidak bisa dibaca → tetap pakai cache (offline).
 */
export function decideVersion(serverId: string | null, cachedId: string | null): VersionDecision {
  if (serverId === null || serverId === "") return "unknown";
  if (cachedId === null || cachedId === "") return "update";
  return serverId === cachedId ? "up-to-date" : "update";
}
