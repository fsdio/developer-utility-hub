#!/usr/bin/env node
/**
 * Artefak tambahan untuk GitHub Pages (technical-design §12):
 * - 404.html  : deep link tak dikenal tetap mendarat di aplikasi
 * - .nojekyll : agar folder assets/ tidak diabaikan Jekyll
 */
import { writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { siteBase } from "./site-base.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

const indexHtml = await readFile(join(DIST, "index.html"), "utf8");
/** Base path build ini ("/" untuk custom domain). Dipakai skrip redirect 404. */
const BASE = siteBase();
const redirectScript = `
    <script>
      // GitHub Pages menyajikan 404.html untuk path tak dikenal; kembalikan ke hash route.
      (function () {
        var fallbackBase = ${JSON.stringify(BASE)};
        var target = location.pathname.indexOf(fallbackBase) === 0
          ? location.pathname.slice(fallbackBase.length - 1)
          : "/";
        if (!location.hash) location.replace(fallbackBase + "#" + target + location.search);
      })();
    </script>`;

const notFound = indexHtml.replace("</body>", `${redirectScript}\n  </body>`);
await writeFile(join(DIST, "404.html"), notFound, "utf8");
await writeFile(join(DIST, ".nojekyll"), "", "utf8");

/**
 * version.json — ID penentu build (ADR-0013).
 * Hash dari index.html: berubah bila chunk utama berubah, karena nama berkas
 * ber-hash ikut tertulis di dalamnya.
 */
const version = {
  id: createHash("sha256").update(indexHtml).digest("hex").slice(0, 16),
  builtAt: new Date().toISOString(),
};
await writeFile(join(DIST, "version.json"), `${JSON.stringify(version, null, 2)}\n`, "utf8");

console.log(
  `✓ dist/404.html, dist/.nojekyll, dan dist/version.json (id ${version.id}) dibuat.`,
);
