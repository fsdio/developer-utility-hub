/**
 * Case conversion engine — murni, tanpa DOM.
 * Aturan mengikat: docs/adr/0001-case-conversion-rules.md
 */

export const CASE_STYLES = [
  "uppercase",
  "lowercase",
  "title",
  "sentence",
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
] as const;

export type CaseStyle = (typeof CASE_STYLES)[number];

export const CASE_STYLE_LABELS: Record<CaseStyle, string> = {
  uppercase: "UPPERCASE",
  lowercase: "lowercase",
  title: "Title Case",
  sentence: "Sentence case",
  camel: "camelCase",
  pascal: "PascalCase",
  snake: "snake_case",
  kebab: "kebab-case",
  constant: "CONSTANT_CASE",
};

/** Separator & tanda baca yang memisahkan token (ADR-0001 §1.1). */
const SEPARATORS = /[\s_\-./\\:;|+&@#~!?,()[\]{}<>"']+/u;

/**
 * Tokenisasi: pisahkan separator, batas lower→UPPER, batas UPPER→Upper+lower,
 * dan batas digit→letter (tetapi bukan letter→digit). Semua hasil lowercase.
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  for (const chunk of input.split(SEPARATORS)) {
    if (!chunk) continue;
    // Sisipkan penanda batas, lalu pecah.
    const marked = chunk
      // lower/digit -> UPPER : userID -> user|ID
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1\u0000$2")
      // UPPER-run -> Upper+lower : HTTPResponse -> HTTP|Response
      .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1\u0000$2")
      // digit-run -> letter : v2Api -> v2|Api (letter->digit TIDAK dipisah)
      .replace(/(\p{N})(\p{L})/gu, "$1\u0000$2");
    for (const part of marked.split("\u0000")) {
      const trimmed = part.trim();
      if (trimmed) tokens.push(trimmed.toLocaleLowerCase());
    }
  }
  return tokens;
}

const capitalize = (word: string): string =>
  word.length === 0 ? word : word.charAt(0).toLocaleUpperCase() + word.slice(1);

/** Gaya yang mempertahankan struktur teks asli (tidak lewat tokenisasi). */
function plainStyle(input: string, locale: string | undefined): Record<"uppercase" | "lowercase" | "title" | "sentence", string> {
  const upper = input.toLocaleUpperCase(locale);
  const lower = input.toLocaleLowerCase(locale);
  const title = input.replace(/\S+/gu, (word) =>
    word.charAt(0).toLocaleUpperCase(locale) + word.slice(1).toLocaleLowerCase(locale),
  );
  const sentenceLower = lower;
  const sentence = sentenceLower.replace(
    /(^|[.!?]\s+)(\p{Ll})/gu,
    (_m, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase(locale),
  );
  return { uppercase: upper, lowercase: lower, title, sentence };
}

/** Konversi satu input ke semua gaya sekaligus. */
export function convertAll(input: string, locale?: string): Record<CaseStyle, string> {
  const plain = plainStyle(input, locale);
  const tokens = tokenize(input);
  const joined = (sep: string) => tokens.join(sep);

  const camel = tokens
    .map((t, i) => (i === 0 ? t : capitalize(t)))
    .join("");
  const pascal = tokens.map(capitalize).join("");

  return {
    ...plain,
    camel,
    pascal,
    snake: joined("_"),
    kebab: joined("-"),
    constant: joined("_").toLocaleUpperCase(locale),
  };
}

export function convert(input: string, style: CaseStyle, locale?: string): string {
  return convertAll(input, locale)[style];
}
