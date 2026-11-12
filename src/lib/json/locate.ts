/**
 * Pelacak posisi error JSON untuk mesin yang tidak memberi `position`
 * (mis. V8 modern: "Unexpected token ',', ... is not valid JSON").
 *
 * Ini bukan parser penuh: ia hanya memindai struktur untuk menemukan offset
 * karakter pertama yang tidak sesuai tata bahasa JSON. Hasil `null` berarti
 * pemindaian tidak dapat menentukan posisi (mis. input terpotong di ujung).
 */

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);

class Bail extends Error {}

interface Cursor {
  index: number;
}

function skipWhitespace(source: string, cursor: Cursor): void {
  while (cursor.index < source.length && WHITESPACE.has(source.charAt(cursor.index))) {
    cursor.index += 1;
  }
}

function expectValue(source: string, cursor: Cursor, depth: number): void {
  if (depth > 500) throw new Bail();
  skipWhitespace(source, cursor);
  if (cursor.index >= source.length) throw new Bail();

  const char = source.charAt(cursor.index);

  if (char === "{") {
    parseObject(source, cursor, depth);
    return;
  }
  if (char === "[") {
    parseArray(source, cursor, depth);
    return;
  }
  if (char === '"') {
    parseString(source, cursor);
    return;
  }
  if (char === "-" || (char >= "0" && char <= "9")) {
    parseNumber(source, cursor);
    return;
  }
  if (source.startsWith("true", cursor.index)) {
    cursor.index += 4;
    return;
  }
  if (source.startsWith("false", cursor.index)) {
    cursor.index += 5;
    return;
  }
  if (source.startsWith("null", cursor.index)) {
    cursor.index += 4;
    return;
  }
  // Karakter tidak dikenal sebagai awal nilai.
  throw new Bail();
}

function parseString(source: string, cursor: Cursor): void {
  // cursor berada pada kutip pembuka
  cursor.index += 1;
  while (cursor.index < source.length) {
    const char = source.charAt(cursor.index);
    if (char === "\\") {
      cursor.index += 2;
      continue;
    }
    if (char === '"') {
      cursor.index += 1;
      return;
    }
    if (char === "\n") throw new Bail();
    cursor.index += 1;
  }
  throw new Bail();
}

function parseNumber(source: string, cursor: Cursor): void {
  const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(source.slice(cursor.index));
  if (!match) throw new Bail();
  cursor.index += match[0].length;
}

function parseObject(source: string, cursor: Cursor, depth: number): void {
  cursor.index += 1; // {
  skipWhitespace(source, cursor);
  if (source.charAt(cursor.index) === "}") {
    cursor.index += 1;
    return;
  }

  for (;;) {
    skipWhitespace(source, cursor);
    if (source.charAt(cursor.index) !== '"') throw new Bail();
    parseString(source, cursor);
    skipWhitespace(source, cursor);
    if (source.charAt(cursor.index) !== ":") throw new Bail();
    cursor.index += 1;
    expectValue(source, cursor, depth + 1);
    skipWhitespace(source, cursor);
    const char = source.charAt(cursor.index);
    if (char === ",") {
      cursor.index += 1;
      continue;
    }
    if (char === "}") {
      cursor.index += 1;
      return;
    }
    throw new Bail();
  }
}

function parseArray(source: string, cursor: Cursor, depth: number): void {
  cursor.index += 1; // [
  skipWhitespace(source, cursor);
  if (source.charAt(cursor.index) === "]") {
    cursor.index += 1;
    return;
  }

  for (;;) {
    expectValue(source, cursor, depth + 1);
    skipWhitespace(source, cursor);
    const char = source.charAt(cursor.index);
    if (char === ",") {
      cursor.index += 1;
      continue;
    }
    if (char === "]") {
      cursor.index += 1;
      return;
    }
    throw new Bail();
  }
}

/** Offset error pertama, atau null bila tidak dapat ditentukan. */
export function locateErrorOffset(source: string): number | null {
  const cursor: Cursor = { index: 0 };
  let lastIndex = 0;
  try {
    expectValue(source, cursor, 0);
    lastIndex = cursor.index;
    skipWhitespace(source, cursor);
    if (cursor.index < source.length) return cursor.index;
    return null;
  } catch {
    return cursor.index > 0 ? cursor.index : lastIndex > 0 ? lastIndex : null;
  }
}
