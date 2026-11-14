/**
 * String escape/unescape untuk konteks yang sering dipakai saat debugging:
 * JSON, JavaScript, HTML, SQL, dan XML. Murni, tanpa DOM.
 */
import { err, ok, type Result } from "@/types/result";
import { decodeHtmlEntities, encodeHtmlEntities } from "@/lib/encoding/html-entity";

export const ESCAPE_TARGETS = ["json", "js", "html", "sql", "xml"] as const;
export type EscapeTarget = (typeof ESCAPE_TARGETS)[number];

export const ESCAPE_TARGET_LABELS: Record<EscapeTarget, string> = {
  json: "JSON string",
  js: "JavaScript string",
  html: "HTML",
  sql: "SQL (LIKE/quote)",
  xml: "XML",
};

const JS_ESCAPES: ReadonlyArray<[RegExp, string]> = [
  [/\\/g, "\\\\"],
  [/\n/g, "\\n"],
  [/\r/g, "\\r"],
  [/\t/g, "\\t"],
  [/\f/g, "\\f"],
  [/\v/g, "\\v"],
  // eslint-disable-next-line no-control-regex -- NUL memang karakter yang di-escape
  [/\u0000/g, "\\0"],
  [/'/g, "\\'"],
  [/"/g, '\\"'],
];

const XML_ESCAPES: ReadonlyArray<[RegExp, string]> = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&apos;"],
];

export function escapeString(input: string, target: EscapeTarget): string {
  switch (target) {
    case "json":
      // JSON.stringify menghasilkan string berkutip ganda beserta escape-nya.
      return JSON.stringify(input);
    case "js":
      return JS_ESCAPES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
    case "html":
      return encodeHtmlEntities(input);
    case "sql":
      return input.replace(/'/g, "''");
    case "xml":
      return XML_ESCAPES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
    default:
      return input;
  }
}

export function unescapeString(input: string, target: EscapeTarget): Result<string> {
  switch (target) {
    case "json": {
      const trimmed = input.trim();
      const startsQuoted = trimmed.startsWith('"') || trimmed.startsWith("'");
      const endsQuoted = trimmed.endsWith('"') || trimmed.endsWith("'");

      if (startsQuoted && !endsQuoted) {
        return err({ kind: "parse", message: "String JSON tidak ditutup dengan kutip." });
      }

      // Urutan percobaan: interpretasi escape lebih dulu, lalu perlakuan literal.
      const candidates: string[] = [];
      if (startsQuoted) {
        candidates.push(
          trimmed.startsWith("'")
            ? `"${trimmed.slice(1, -1).replace(/\\'/g, "'").replace(/"/g, '\\"')}"`
            : trimmed,
        );
      } else {
        candidates.push(`"${trimmed.replace(/"/g, '\\"')}"`);
        candidates.push(`"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
      }

      for (const candidate of candidates) {
        try {
          const parsed: unknown = JSON.parse(candidate);
          if (typeof parsed === "string") return ok(parsed);
        } catch {
          // coba bentuk berikutnya
        }
      }
      return err({
        kind: "parse",
        message: "Bukan string JSON yang valid. Periksa escape seperti \\n, \\t, dan \\\".",
      });
    }
    case "js":
      try {
        // Hanya menerima bentuk string literal; tidak dieksekusi sebagai kode.
        const parsed: unknown = JSON.parse(`"${input.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`);
        return typeof parsed === "string"
          ? ok(parsed)
          : err({ kind: "parse", message: "Input bukan string JavaScript." });
      } catch {
        return err({ kind: "parse", message: "Escape JavaScript tidak valid." });
      }
    case "html":
      return ok(decodeHtmlEntities(input));
    case "sql":
      return ok(input.replace(/''/g, "'"));
    case "xml":
      return ok(
        input
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&"),
      );
    default:
      return ok(input);
  }
}

/**
 * Escape untuk payload yang dibawa formatter (JSON/XML).
 *
 * `EscapeTarget` di atas ditujukan untuk *isi string* (HTML, SQL, dsb).
 * Formatter butuh dua hal berbeda, dan keduanya diberi nama sendiri agar
 * tidak tertukar (ADR-0012):
 *
 * - `json-string`    → strings: menghasilkan isi string JSON *tanpa* kutip,
 *                      siap disisipkan ke dalam dokumen JSON.
 * - `json-document`  → documents: membungkus teks mentah menjadi nilai string
 *                      JSON berkutip, sah sebagai dokumen JSON utuh.
 * - `xml-text`       → strings: escape lima entitas XML untuk isi elemen/atribut.
 * - `xml-document`   → documents: membungkus teks sebagai elemen `<escaped>`.
 */
export type FormatterEscapeTarget = "json-string" | "json-document" | "xml-text" | "xml-document";

export const FORMATTER_ESCAPE_TARGETS = [
  "json-string",
  "json-document",
  "xml-text",
  "xml-document",
] as const satisfies readonly FormatterEscapeTarget[];

export const FORMATTER_ESCAPE_LABELS: Record<FormatterEscapeTarget, string> = {
  "json-string": "Isi string JSON (tanpa kutip)",
  "json-document": "Dokumen JSON (dibungkus kutip)",
  "xml-text": "Isi elemen/atribut XML",
  "xml-document": "Dokumen XML (<escaped>…</escaped>)",
};

export function escapeForFormatter(input: string, target: FormatterEscapeTarget): string {
  switch (target) {
    case "json-string":
      // JSON.stringify memberi hasil berkutip; kutip terluar dibuang sehingga
      // hasilnya aman disisipkan sebagai isi string di dalam dokumen JSON.
      return JSON.stringify(input).slice(1, -1);
    case "json-document":
      return JSON.stringify(input);
    case "xml-text":
      return XML_ESCAPES.reduce(
        (text, [pattern, replacement]) => text.replace(pattern, replacement),
        input,
      );
    case "xml-document":
      return `<escaped>${XML_ESCAPES.reduce(
        (text, [pattern, replacement]) => text.replace(pattern, replacement),
        input,
      )}</escaped>`;
    default:
      return input;
  }
}

export function unescapeForFormatter(input: string, target: FormatterEscapeTarget): Result<string> {
  switch (target) {
    case "json-string":
    case "json-document": {
      const trimmed = input.trim();
      if (trimmed === "") return ok("");
      // Dokumen JSON datang dengan kutip terluar; isi string tidak.
      const body =
        target === "json-document" && trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
          ? trimmed.slice(1, -1)
          : trimmed;
      return unescapeJsonEscapes(body);
    }
    case "xml-text":
    case "xml-document": {
      const body =
        target === "xml-document"
          ? (/^\s*<escaped>([\s\S]*)<\/escaped>\s*$/.exec(input)?.[1] ?? input)
          : input;
      return ok(
        body
          .replace(/&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&"),
      );
    }
    default:
      return ok(input);
  }
}

const SIMPLE_ESCAPES: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

/**
 * Menafsirkan escape JSON satu per satu.
 *
 * Tidak memakai `JSON.parse` karena teks yang ditempel pengguna sering berisi
 * baris baru nyata: `JSON.parse` menolaknya sebagai control character, padahal
 * teks itu tidak sedang dalam bentuk dokumen JSON. Penafsir ini hanya mengubah
 * escape yang dikenal; `\\uXXXX` divalidasi, escape tak dikenal dibiarkan apa
 * adanya, dan backslash di akhir input dilaporkan sebagai error.
 */
export function unescapeJsonEscapes(body: string): Result<string> {
  let out = "";
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char !== "\\") {
      out += char;
      continue;
    }
    const next = body[index + 1];
    if (next === undefined) {
      return err({
        kind: "parse",
        message: "Backslash di akhir input tidak diikuti karakter escape.",
      });
    }
    if (next === "u") {
      const hex = body.slice(index + 2, index + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
        return err({ kind: "parse", message: "Escape \\u harus diikuti 4 digit heksadesimal." });
      }
      out += String.fromCharCode(Number.parseInt(hex, 16));
      index += 5;
      continue;
    }
    const simple = SIMPLE_ESCAPES[next];
    out += simple ?? `\\${next}`;
    index += 1;
  }
  return ok(out);
}
