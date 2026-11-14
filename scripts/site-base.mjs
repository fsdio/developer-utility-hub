/**
 * Satu sumber kebenaran untuk base path situs (ADR-0016).
 *
 * Dulu base di-hardcode `/developer-utility-hub/` di tiga tempat (vite.config,
 * postbuild, preview-check) sehingga pindah ke custom domain menuntut tiga
 * suntingan yang mudah terlewat. Sekarang cukup satu env var:
 *
 *   VITE_BASE_PATH=/developer-utility-hub/   → project page GitHub Pages
 *   (tidak diset)                            → root domain / custom domain
 */

/** Base path yang dipakai Vite (`base`), selalu berakhir dengan "/". */
export function siteBase() {
  const raw = process.env.VITE_BASE_PATH ?? "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}
