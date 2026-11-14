#!/usr/bin/env node
/**
 * Smoke test hasil build pada base path yang dipakai build itu (technical-design
 * §12). Memastikan index.html dan semua aset yang dirujuk dapat dilayani dari
 * base tersebut dan tidak ada referensi absolut ke luar base.
 *
 * Base ditentukan oleh `scripts/site-base.mjs` (ADR-0016): "/" untuk custom
 * domain, atau VITE_BASE_PATH=/developer-utility-hub/ untuk project page.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { siteBase } from "./site-base.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const BASE = siteBase();
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PREVIEW_PORT ?? 4319);
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${HOST}`);
  let path = url.pathname;

  if (BASE !== "/" && path === BASE.slice(0, -1)) {
    response.writeHead(302, { Location: BASE });
    response.end();
    return;
  }
  if (!path.startsWith(BASE)) {
    response.writeHead(404).end("not found");
    return;
  }

  path = path.slice(BASE.length);
  if (path === "" || path.endsWith("/")) path = `${path}index.html`;

  const filePath = join(DIST, normalize(path));
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    // Fallback SPA (mirip 404.html pada GitHub Pages).
    try {
      const body = await readFile(join(DIST, "404.html"));
      response.writeHead(404, { "content-type": MIME[".html"] });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  }
});

const listen = () =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, HOST, resolve);
  });

const check = async () => {
  await listen();
  const origin = `http://${HOST}:${PORT}`;
  const failures = [];

  const indexUrl = `${origin}${BASE}`;
  const indexResponse = await fetch(indexUrl);
  const html = await indexResponse.text();
  if (indexResponse.status !== 200) failures.push(`index.html mengembalikan ${indexResponse.status}`);
  console.log(`✓ index.html: ${indexResponse.status} (${indexUrl})`);

  const assetRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const localAssets = assetRefs.filter((ref) => ref.startsWith(BASE));

  for (const ref of localAssets) {
    const assetResponse = await fetch(`${origin}${ref}`);
    const ok = assetResponse.status === 200;
    console.log(`${ok ? "✓" : "✗"} ${ref}: ${assetResponse.status}`);
    if (!ok) failures.push(`${ref} mengembalikan ${assetResponse.status}`);
  }

  if (localAssets.length === 0 && BASE !== "/") {
    failures.push("Tidak ada aset dengan base path yang benar di index.html");
  }

  // Berkas yang wajib ada di artefak apa pun base-nya (ADR-0013/ADR-0016).
  for (const required of ["version.json", "sw.js", "manifest.webmanifest", "404.html"]) {
    const response = await fetch(`${origin}${BASE}${required}`);
    const ok = response.status === 200;
    console.log(`${ok ? "✓" : "✗"} ${BASE}${required}: ${response.status}`);
    if (!ok) failures.push(`${required} tidak tersedia di build`);
  }

  // Referensi absolut di luar base akan 404 di GitHub Pages (mis. build custom
  // domain yang masih menunjuk /developer-utility-hub/).
  const outsideBase = assetRefs.filter((ref) => ref.startsWith("/") && !ref.startsWith(BASE));
  if (outsideBase.length > 0) {
    failures.push(`Referensi di luar base ${BASE} (akan 404): ${outsideBase.join(", ")}`);
  }

  const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  if (!csp) {
    failures.push("Meta CSP tidak ditemukan di build produksi");
  } else {
    // Harus 'self' agar cek versi (version.json) tidak diblokir, tetapi tidak
    // boleh lebih longgar dari itu — privasi input tetap terjaga (ADR-0013).
    if (!csp[1].includes("connect-src 'self'")) {
      failures.push("CSP harus menetapkan connect-src 'self'");
    }
    if (/connect-src[^;]*(\*|https?:)/.test(csp[1])) {
      failures.push("CSP connect-src terlalu longgar: hanya 'self' yang diizinkan");
    }
    console.log("✓ Meta CSP tersuntik dengan connect-src 'self'");
  }

  server.close();
  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} masalah pada build:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`\n✓ Build berfungsi pada base path "${BASE}".`);
};

check().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
