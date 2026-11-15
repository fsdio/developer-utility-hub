import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
// @ts-expect-error — modul .mjs tanpa deklarasi tipe; lihat scripts/site-base.mjs
import { siteBase } from "./scripts/site-base.mjs";


/**
 * Base path situs (ADR-0006 §6, diperbarui ADR-0016).
 * - default      -> "/" (custom domain https://developerutilityhub.web.id/)
 * - dev/preview  -> "/" (agar preview lokal & sandbox tetap di root)
 * - project page -> VITE_BASE_PATH=/developer-utility-hub/
 *
 * Nilai yang sama dipakai `scripts/postbuild.mjs` dan `scripts/preview-check.mjs`
 * lewat `scripts/site-base.mjs`, jadi berpindah domain cukup satu env var.
 */
const PROJECT_BASE = siteBase();

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  // Pratinjau gambar/PDF memakai `blob:` dari `URL.createObjectURL` — tetap
  // dibuat di perangkat, tidak ada permintaan jaringan (ADR-0021). Tanpa
  // `blob:` di sini, build produksi menampilkan kotak pratinjau kosong
  // sementara dev server terlihat normal (CSP hanya disuntik saat build).
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  // `connect-src 'self'` (bukan 'none'): satu-satunya permintaan jaringan sah
  // adalah `version.json` milik origin ini untuk cek versi (ADR-0013 §12.1).
  // 'none' akan memblokir cek versi sehingga build baru tak pernah terdeteksi.
  "connect-src 'self'",
  // `object-src` hanya untuk pratinjau PDF (`<object data="blob:…">`) yang
  // dirender penampil bawaan browser; tetap lokal, tanpa origin luar.
  "object-src 'self' blob:",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

/** CSP hanya disuntikkan pada build produksi (dev butuh inline preamble React Refresh). */
function injectCsp() {
  return {
    name: "duh-inject-csp",
    apply: "build" as const,
    transformIndexHtml(html: string) {
      return html.replace(
        "<!-- CSP_PLACEHOLDER -->",
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? PROJECT_BASE : "/",
  plugins: [react(), injectCsp()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    // Preview sandbox memakai host dinamis (*.e2b.app); izinkan semua host
    // preview agar dev server dapat dibuka dari browser pengguna.
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".e2b.app"],
  },
  build: {
    target: "es2022",
    sourcemap: false,
    reportCompressedSize: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/registry/**"],
    },
  },
}));
