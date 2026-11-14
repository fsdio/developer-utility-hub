import {
  VERSION_PATH,
  decideVersion,
  parseVersionJson,
  type VersionDecision,
} from "@/lib/browser/sw-version";
import { PREFERENCE_KEYS, readPreference, writePreference } from "@/lib/browser/storage";

/** Disimpan terpisah dari preferensi tampilan; bukan data pengguna. */
const VERSION_KEY = PREFERENCE_KEYS.buildVersion;

export interface OfflineStatus {
  /** Hasil pemeriksaan versi ke server. */
  decision: VersionDecision;
  /** Service worker aktif dan siap melayani dari cache. */
  ready: boolean;
}

const readCachedVersion = (): string | null => readPreference(VERSION_KEY);

const waitForActivation = (registration: ServiceWorkerRegistration): Promise<void> =>
  new Promise((resolve) => {
    if (registration.active) {
      resolve();
      return;
    }
    const worker = registration.installing ?? registration.waiting;
    if (!worker) {
      resolve();
      return;
    }
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
    });
  });

/**
 * Mendaftarkan service worker lalu memutuskan apakah perlu reload.
 *
 * Alur (ADR-0013):
 * 1. Ambil `version.json` dari server — satu-satunya permintaan jaringan rutin.
 * 2. Bandingkan dengan id yang tersimpan di browser.
 * 3. Sama → pakai cache, tidak reload. Beda → simpan id baru, lalu reload sekali
 *    agar dokumen dan chunk memakai build baru.
 * 4. Gagal/jaringan mati → pakai cache apa adanya (mode offline).
 */
export async function registerOfflineMode(): Promise<OfflineStatus> {
  if (typeof window === "undefined") return { decision: "unknown", ready: false };

  if (!("serviceWorker" in navigator)) {
    return { decision: "unknown", ready: false };
  }

  const base = import.meta.env.BASE_URL;
  const scope = new URL(base, window.location.origin).pathname;

  try {
    const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope });
    await waitForActivation(registration);

    const cachedId = readCachedVersion();
    const serverId = await fetchVersionId(base);
    const decision = decideVersion(serverId, cachedId);

    if (serverId !== null && serverId !== cachedId) {
      writePreference(VERSION_KEY, serverId);
      if (cachedId !== null) {
        // Build berubah: muat ulang sekali. Dijaga flag sesi agar tidak berulang.
        const guard = "duh:reloaded-for-version";
        if (sessionStorage.getItem(guard) !== serverId) {
          sessionStorage.setItem(guard, serverId);
          window.location.reload();
        }
      }
    }

    return { decision, ready: true };
  } catch {
    // Offline sejak awal atau SW tidak didukung: aplikasi tetap jalan dari cache HTTP.
    return { decision: "unknown", ready: false };
  }
}

async function fetchVersionId(base: string): Promise<string | null> {
  try {
    const response = await fetch(`${base}${VERSION_PATH}`, { cache: "no-store" });
    if (!response.ok) return null;
    const parsed = parseVersionJson(await response.text());
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}
