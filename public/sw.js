/// <reference lib="webworker" />
/**
 * Service worker (ADR-0013).
 *
 * Strategi:
 * - Aset ber-hash dari `assets/` disimpan cache-first selamanya (namanya berubah
 *   bila isinya berubah, jadi tidak ada risiko basi).
 * - Navigasi/HTML memakai network-first dengan fallback cache agar halaman tetap
 *   terbuka saat offline.
 * - `version.json` TIDAK pernah di-cache: hanya berkas ini yang perlu ditanya ke
 *   server untuk menentukan apakah build berubah.
 */
const CACHE = "duh-shell-v1";
const PRECACHE = ["index.html", "manifest.webmanifest", "favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const isVersionRequest = (url) => url.pathname.endsWith("/version.json");
const isHashedAsset = (url) => url.pathname.includes("/assets/");

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // version.json selalu dari jaringan; kegagalan ditangani pemanggil.
  if (isVersionRequest(url)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // HTML / navigasi: network-first, fallback ke cache saat offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit ?? caches.match("index.html")).then((hit) => hit),
      ),
  );
});
