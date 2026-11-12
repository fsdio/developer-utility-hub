#!/usr/bin/env node
/**
 * Verifikasi kontras WCAG AA untuk kedua tema (ui-specification §1.1).
 * Membaca token langsung dari src/styles/tokens.css agar tidak ada duplikasi nilai.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const css = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");

const parseBlock = (startPattern) => {
  const start = css.indexOf(startPattern);
  if (start === -1) throw new Error(`Blok tema tidak ditemukan: ${startPattern}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const body = css.slice(open + 1, close);
  const tokens = {};
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
};

const light = parseBlock(":root {");
const dark = { ...light, ...parseBlock('[data-theme="dark"] {') };

const toRgb = (value) => {
  const hex = value.trim().replace("#", "");
  if (hex.length !== 6) throw new Error(`Warna tidak didukung: ${value}`);
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
};

const luminance = (rgb) =>
  rgb
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);

const contrast = (a, b) => {
  const [l1, l2] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Pasangan teks/latar yang wajib AA (4.5:1) atau AA-large (3:1). */
const PAIRS = [
  ["fg", "bg", 4.5],
  ["fg", "bg-raised", 4.5],
  ["fg", "bg-sunken", 4.5],
  ["fg-muted", "bg", 4.5],
  ["fg-muted", "bg-raised", 4.5],
  ["fg-subtle", "bg", 3],
  ["accent", "bg", 4.5],
  ["accent-fg", "accent", 4.5],
  ["added-fg", "added-bg", 4.5],
  ["removed-fg", "removed-bg", 4.5],
  ["changed-fg", "changed-bg", 4.5],
  ["danger", "bg-raised", 4.5],
];

let failures = 0;

for (const [themeName, tokens] of [["light", light], ["dark", dark]]) {
  for (const [fgToken, bgToken, minimum] of PAIRS) {
    const fg = tokens[fgToken];
    const bg = tokens[bgToken];
    if (!fg || !bg) {
      console.error(`✗ ${themeName}: token tidak ditemukan (${fgToken}/${bgToken})`);
      failures += 1;
      continue;
    }
    const ratio = contrast(fg, bg);
    const status = ratio >= minimum ? "✓" : "✗";
    if (ratio < minimum) failures += 1;
    console.log(
      `${status} ${themeName.padEnd(5)} ${fgToken.padEnd(12)} di ${bgToken.padEnd(11)} ${ratio.toFixed(2)}:1 (min ${minimum})`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} pasangan warna di bawah ambang WCAG AA.`);
  process.exit(1);
}
console.log("\n✓ Semua pasangan warna lolos WCAG AA di kedua tema.");
