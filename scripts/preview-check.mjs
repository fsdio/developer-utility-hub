#!/usr/bin/env node
/**
 * Smoke test hasil build pada base path GitHub Pages (technical-design §12).
 * Memastikan index.html dan semua aset yang dirujuk dapat dilayani dari
 * subpath /developer-utility-hub/ dan tidak ada referensi absolut ke root.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const BASE = "/developer-utility-hub/";
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

  if (path === BASE.slice(0, -1)) {
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

  if (localAssets.length === 0) failures.push("Tidak ada aset dengan base path yang benar di index.html");

  const rootAbsolute = assetRefs.filter((ref) => ref.startsWith("/") && !ref.startsWith(BASE));
  if (rootAbsolute.length > 0) {
    failures.push(`Referensi absolut ke root (akan 404 di GitHub Pages): ${rootAbsolute.join(", ")}`);
  }

  const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  if (!csp) {
    failures.push("Meta CSP tidak ditemukan di build produksi");
  } else {
    if (!csp[1].includes("connect-src 'none'")) failures.push("CSP tidak menetapkan connect-src 'none'");
    console.log("✓ Meta CSP tersuntik dengan connect-src 'none'");
  }

  server.close();
  if (failures.length > 0) {
    console.error(`\n✗ ${failures.length} masalah pada build:`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("\n✓ Build berfungsi pada base path GitHub Pages.");
};

check().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
