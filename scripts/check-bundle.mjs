#!/usr/bin/env node
/**
 * Budget ukuran bundle (technical-design §10).
 * JS awal < 200 KB gzip, chunk tool < 80 KB gzip.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = new URL("..", import.meta.url).pathname;
const ASSETS = join(ROOT, "dist/assets");
const INITIAL_BUDGET_KB = 200;
const TOOL_CHUNK_BUDGET_KB = 80;
const TOOL_CHUNK_PATTERN = /^[A-Z][A-Za-z0-9]*Page-/;
const MIN_TOOL_CHUNKS = 14;

const files = readdirSync(ASSETS).filter((file) => file.endsWith(".js"));
const sizes = files.map((file) => {
  const bytes = readFileSync(join(ASSETS, file));
  return { file, kb: gzipSync(bytes).length / 1024 };
});

const initial = sizes.filter((entry) => !TOOL_CHUNK_PATTERN.test(entry.file) && !entry.file.startsWith("result-") && !entry.file.startsWith("useDebounced"));
const initialTotal = initial.reduce((sum, entry) => sum + entry.kb, 0);
const toolChunks = sizes.filter((entry) => TOOL_CHUNK_PATTERN.test(entry.file));

let failed = false;

console.log(`JS awal (gzip): ${initialTotal.toFixed(1)} KB (budget ${INITIAL_BUDGET_KB} KB)`);
for (const chunk of toolChunks) {
  console.log(`  ${chunk.file}: ${chunk.kb.toFixed(1)} KB`);
  if (chunk.kb > TOOL_CHUNK_BUDGET_KB) {
    console.error(`✗ ${chunk.file} melebihi budget ${TOOL_CHUNK_BUDGET_KB} KB`);
    failed = true;
  }
}

if (initialTotal > INITIAL_BUDGET_KB) {
  console.error(`✗ JS awal melebihi budget ${INITIAL_BUDGET_KB} KB`);
  failed = true;
}
if (toolChunks.length < MIN_TOOL_CHUNKS) {
  console.error(`✗ Diharapkan ${MIN_TOOL_CHUNKS} chunk tool (lazy), ditemukan ${toolChunks.length}.`);
  failed = true;
}

if (failed) process.exit(1);
console.log("✓ Budget bundle terpenuhi.");
