#!/usr/bin/env node
/**
 * Artefak tambahan untuk GitHub Pages (technical-design §12):
 * - 404.html  : deep link tak dikenal tetap mendarat di aplikasi
 * - .nojekyll : agar folder assets/ tidak diabaikan Jekyll
 */
import { copyFile, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");

const indexHtml = await readFile(join(DIST, "index.html"), "utf8");
const redirectScript = `
    <script>
      // GitHub Pages menyajikan 404.html untuk path tak dikenal; kembalikan ke hash route.
      (function () {
        var fallbackBase = ${JSON.stringify("/developer-utility-hub/")};
        var target = location.pathname.indexOf(fallbackBase) === 0
          ? location.pathname.slice(fallbackBase.length - 1)
          : "/";
        if (!location.hash) location.replace(fallbackBase + "#" + target + location.search);
      })();
    </script>`;

const notFound = indexHtml.replace("</body>", `${redirectScript}\n  </body>`);
await writeFile(join(DIST, "404.html"), notFound, "utf8");
await writeFile(join(DIST, ".nojekyll"), "", "utf8");
await copyFile(join(DIST, "404.html"), join(DIST, "404.html"));

console.log("✓ dist/404.html dan dist/.nojekyll dibuat.");
