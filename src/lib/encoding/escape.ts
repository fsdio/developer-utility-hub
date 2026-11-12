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
