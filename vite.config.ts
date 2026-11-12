import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

/**
 * Base path mengikuti nama repository (ADR-0006 §6).
 * - `vite build`  -> /developer-utility-hub/ (GitHub Pages project page)
 * - `vite dev`    -> / (agar preview lokal & sandbox tetap di root)
 * - override eksplisit: VITE_BASE_PATH=/
 */
const PROJECT_BASE = "/developer-utility-hub/";

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
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
  base: process.env.VITE_BASE_PATH ?? (command === "build" ? PROJECT_BASE : "/"),
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
