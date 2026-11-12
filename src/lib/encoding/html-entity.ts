/**
 * HTML entity encode/decode — murni, tanpa DOM dan tanpa innerHTML
 * (technical-design §9: dilarang render HTML mentah).
 */

/** Entity yang di-encode (aman untuk konteks teks HTML). */
const ENCODE_MAP: ReadonlyArray<[string, string]> = [
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
];

/** Tabel entity bernama yang umum; cukup untuk decode praktis tanpa DOM. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  deg: "°",
  plusmn: "±",
  times: "×",
  divide: "÷",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  middot: "·",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  sup2: "²",
  sup3: "³",
  micro: "µ",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
  harr: "↔",
  infin: "∞",
  neq: "≠",
  le: "≤",
  ge: "≥",
  check: "✓",
  hearts: "♥",
};

export function encodeHtmlEntities(input: string): string {
  return ENCODE_MAP.reduce(
    (text, [character, entity]) => text.split(character).join(entity),
    input,
  );
}

/**
 * Decoder: menangani entity bernama yang dikenal dan entity numerik
 * (desimal `&#169;` serta heksadesimal `&#xA9;`). Entity tak dikenal dibiarkan apa
 * adanya agar tidak ada data yang hilang diam-diam.
 */
export function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#[xX][0-9A-Fa-f]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (match, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const codePoint = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint, match) : match;
    }
    if (body.startsWith("#")) {
      const codePoint = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(codePoint) ? safeFromCodePoint(codePoint, match) : match;
    }
    const named = NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()];
    return named ?? match;
  });
}

function safeFromCodePoint(codePoint: number, fallback: string): string {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}
