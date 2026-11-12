#!/usr/bin/env node
/**
 * Menegakkan batas modul (technical-design §7).
 * Engine (src/lib/{text,json,xml,diff}) tidak boleh mengimpor React/DOM.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const ENGINE_DIRS = [
  "src/lib/text",
  "src/lib/json",
  "src/lib/xml",
  "src/lib/diff",
  "src/lib/encoding",
  "src/lib/dev",
];
const FORBIDDEN_IMPORTS = [/from\s+["']react/, /from\s+["']react-dom/, /from\s+["']@\/hooks/, /from\s+["']@\/components/, /from\s+["']@\/features/];
const FORBIDDEN_GLOBALS = [/\bwindow\./, /\bdocument\./, /\blocalStorage\b/, /\bsessionStorage\b/, /\bnavigator\./, /\bfetch\(/];

const walk = (dir) => {
  const absolute = join(ROOT, dir);
  const entries = readdirSync(absolute);
  const files = [];
  for (const entry of entries) {
    const path = join(absolute, entry);
    if (statSync(path).isDirectory()) files.push(...walk(relative(ROOT, path)));
    else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) files.push(relative(ROOT, path));
  }
  return files;
};

let violations = 0;

for (const dir of ENGINE_DIRS) {
  for (const file of walk(dir)) {
    const source = readFileSync(join(ROOT, file), "utf8");
    for (const pattern of FORBIDDEN_IMPORTS) {
      const match = pattern.exec(source);
      if (match) {
        console.error(`✗ ${file}: impor terlarang "${match[0]}" — engine harus murni.`);
        violations += 1;
      }
    }
    // DOMParser/ProcessingInstruction adalah tipe DOM; engine menerima parser via parameter.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const pattern of FORBIDDEN_GLOBALS) {
      const match = pattern.exec(code);
      if (match) {
        console.error(`✗ ${file}: akses global terlarang "${match[0]}" — engine harus murni.`);
        violations += 1;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\nBatas modul dilanggar: ${violations} temuan.`);
  process.exit(1);
}
console.log("✓ Batas modul engine bersih (tidak ada React/DOM di src/lib engine).");
