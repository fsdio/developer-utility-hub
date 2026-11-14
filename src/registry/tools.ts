/**
 * Tool registry — satu-satunya sumber metadata tools (technical-design §3).
 * Navigasi, katalog, pencarian, dan route membaca dari sini.
 */
import type { ComponentType } from "react";

export type ToolCategory = "text" | "formatter" | "diff" | "utilities";
export type ToolStatus = "stable" | "planned";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: readonly string[];
  route: string;
  limitations: readonly string[];
  status: ToolStatus;
  load?: () => Promise<{ default: ComponentType }>;
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  text: "Text",
  formatter: "Formatter",
  diff: "Diff",
  utilities: "Utilities",
};

/** Urutan kategori yang stabil di seluruh UI. */
export const CATEGORY_ORDER: readonly ToolCategory[] = ["text", "formatter", "diff", "utilities"];

export const TOOLS: readonly ToolMeta[] = [
  {
    id: "case-converter",
    name: "Case Converter",
    description: "Konversi teks ke camelCase, snake_case, kebab-case, dan enam gaya lainnya.",
    category: "text",
    keywords: ["case", "camel", "snake", "kebab", "pascal", "constant", "uppercase", "title"],
    route: "#/tools/case-converter",
    limitations: [
      "Hasil menggantikan isi form, jadi teks asli hilang setelah konversi (pakai Reset untuk mengosongkan).",
      "Satu tombol salin untuk seluruh halaman; gaya bisa dirangkai karena hasil menjadi input berikutnya.",
      "Akronim tidak dipertahankan: userID menjadi userId.",
      "Diakritik tidak dinormalisasi: café tetap café.",
    ],
    status: "stable",
    load: () => import("@/features/text/case-converter/CaseConverterPage"),
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format, minify, validasi, dan escape JSON dengan error berposisi baris/kolom.",
    category: "formatter",
    keywords: ["json", "format", "beautify", "minify", "validate", "escape", "unescape", "pretty"],
    route: "#/tools/json-formatter",
    limitations: [
      "Angka di atas 2^53 bisa kehilangan presisi (batasan Number).",
      "Key duplikat: yang terakhir menang.",
      "Escape menghasilkan bentuk untuk disisipkan, bukan JSON yang di-parse balik.",
      "Unescape menafsirkan escape JSON satu per satu; escape tak dikenal dibiarkan apa adanya.",
      "Format/Minify/Escape mengganti isi form; simpan salinan dulu bila teks asli masih dibutuhkan.",
    ],
    status: "stable",
    load: () => import("@/features/data/json-formatter/JsonFormatterPage"),
  },
  {
    id: "xml-formatter",
    name: "XML Formatter",
    description:
      "Format, minify, dan escape XML, dengan komentar serta processing instruction dipertahankan.",
    category: "formatter",
    keywords: ["xml", "format", "beautify", "minify", "escape", "entity", "well-formed", "namespace"],
    route: "#/tools/xml-formatter",
    limitations: [
      "Bukan penjamin round-trip: CDATA ditulis ulang sebagai teks ter-escape.",
      "DTD dan entity kustom tidak didukung; akan dilaporkan sebagai error parse.",
      "Format/Minify/Escape mengganti isi form; komentar mengikuti opsi yang aktif saat aksi ditekan.",
    ],
    status: "stable",
    load: () => import("@/features/data/xml-formatter/XmlFormatterPage"),
  },
  {
    id: "text-diff",
    name: "Text Diff",
    description: "Bandingkan dua teks baris per baris, dengan highlight karakter yang berubah.",
    category: "diff",
    keywords: ["diff", "compare", "text", "lines", "patch"],
    route: "#/tools/text-diff",
    limitations: [
      "Batas 1.000.000 karakter gabungan untuk kedua panel.",
      "Opsi ignore hanya memengaruhi pembandingan, bukan teks yang ditampilkan.",
      "Perbedaan tampil sebagai sorotan baris/karakter di dalam kedua form, bukan panel hasil.",
    ],
    status: "stable",
    load: () => import("@/features/comparison/text-diff/TextDiffPage"),
  },
  {
    id: "json-diff",
    name: "JSON Diff",
    description: "Bandingkan dua JSON secara struktural dan lihat perubahan per path, plus JSON Patch.",
    category: "diff",
    keywords: ["json", "diff", "compare", "json pointer", "json patch", "rfc 6902"],
    route: "#/tools/json-diff",
    limitations: [
      "Urutan key object diabaikan; urutan elemen array dianggap bermakna.",
      "JSON Patch bersifat deskriptif, tidak dijamin bisa di-apply.",
      "Perubahan per path tampil di dalam panel kanan; tidak ada sorotan per baris karena perbandingannya struktural.",
    ],
    status: "stable",
    load: () => import("@/features/comparison/json-diff/JsonDiffPage"),
  },
  {
    id: "base64",
    name: "Base64 Encode / Decode",
    description: "Encode teks ke Base64 atau decode kembali, UTF-8 aman, dengan varian URL-safe.",
    category: "utilities",
    keywords: ["base64", "encode", "decode", "url-safe", "utf-8"],
    route: "#/tools/base64",
    limitations: [
      "Hasil menggantikan isi form, jadi teks asli hilang setelah konversi (pakai Reset untuk mengosongkan).",
      "Base64 adalah encoding, bukan enkripsi — siapa pun bisa men-decode-nya.",
      "Decode hanya menerima hasil yang valid sebagai teks UTF-8.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/base64/Base64Page"),
  },
  {
    id: "url-encoder",
    name: "URL Encode / Decode",
    description: "Percent-encoding untuk query string dan path, termasuk gaya form dengan tanda +.",
    category: "utilities",
    keywords: ["url", "uri", "percent", "encode", "decode", "query", "escape"],
    route: "#/tools/url-encoder",
    limitations: [
      "Hasil menggantikan isi form, jadi teks asli hilang setelah konversi (pakai Reset untuk mengosongkan).",
      "Encode mengikuti encodeURIComponent, bukan encodeURI untuk URL utuh.",
      "Tanda + hanya berarti spasi pada mode form; di path ia tetap literal.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/url-encoder/UrlEncoderPage"),
  },
  {
    id: "html-entity",
    name: "HTML Entity Encode / Decode",
    description: "Ubah karakter berbahaya menjadi entity HTML dan decode kembali, tanpa menyentuh DOM.",
    category: "utilities",
    keywords: ["html", "entity", "escape", "decode", "amp", "nbsp"],
    route: "#/tools/html-entity",
    limitations: [
      "Hasil menggantikan isi form, jadi teks asli hilang setelah konversi (pakai Reset untuk mengosongkan).",
      "Decode hanya mengenal entity bernama yang umum; entity tak dikenal dibiarkan apa adanya.",
      "Encode bukan sanitizer: jangan andalkan untuk membersihkan HTML dari pengguna.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/html-entity/HtmlEntityPage"),
  },
  {
    id: "escape",
    name: "String Escape / Unescape",
    description: "Escape dan unescape untuk konteks JSON, JavaScript, HTML, SQL, dan XML.",
    category: "utilities",
    keywords: ["escape", "unescape", "json", "javascript", "sql", "xml", "quote"],
    route: "#/tools/escape",
    limitations: [
      "Hasil menggantikan isi form, jadi teks asli hilang setelah konversi (pakai Reset untuk mengosongkan).",
      "SQL hanya menangani kutip tunggal standar; dialek dengan escape khusus perlu penanganan sendiri.",
      "Unescape JS menerima string literal, bukan mengeksekusi kode.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/escape/EscapePage"),
  },
  {
    id: "uuid",
    name: "UUID Generator",
    description: "Buat UUID v4 (acak) atau v7 (berurutan waktu) memakai Web Crypto.",
    category: "utilities",
    keywords: ["uuid", "guid", "v4", "v7", "random", "identifier"],
    route: "#/tools/uuid",
    limitations: [
      "Satu tombol salin menyalin seluruh daftar; UUID tunggal bisa dipilih dengan seleksi teks.",
      "UUID bukan rahasia: jangan dijadikan satu-satunya pengaman akses.",
      "UUID v7 memuat timestamp sehingga dapat mengungkap waktu pembuatan.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/uuid/UuidPage"),
  },
  {
    id: "hash",
    name: "Hash Generator (SHA)",
    description: "Hitung SHA-256, SHA-512, atau SHA-1 dari teks, dalam bentuk hex dan Base64.",
    category: "utilities",
    keywords: ["hash", "sha256", "sha512", "sha1", "digest", "crypto"],
    route: "#/tools/hash",
    limitations: [
      "Satu tombol salin menyalin digest hex; bentuk Base64 terlihat tetapi tidak punya tombol sendiri.",
      "Hash bukan enkripsi dan tidak dapat dibalik.",
      "Memerlukan konteks aman (HTTPS atau localhost) agar Web Crypto tersedia.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/hash/HashPage"),
  },
  {
    id: "timestamp",
    name: "Unix Timestamp Converter",
    description: "Ubah epoch ke tanggal, dan sebaliknya, dengan UTC dan zona waktu lokal berdampingan.",
    category: "utilities",
    keywords: ["timestamp", "epoch", "unix", "iso8601", "timezone", "utc"],
    route: "#/tools/timestamp",
    limitations: [
      "Satu tombol salin menyalin semua representasi sekaligus sebagai teks berlabel.",
      "Angka ≥ 1e12 dibaca sebagai milidetik; selain itu detik.",
      "Tanggal tanpa offset dibaca sebagai waktu lokal perangkat Anda.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/timestamp/TimestampPage"),
  },
  {
    id: "color",
    name: "Color Converter",
    description: "Konversi HEX, RGB, dan HSL dua arah, lengkap dengan pratinjau dan kontras teks.",
    category: "utilities",
    keywords: ["color", "warna", "hex", "rgb", "hsl", "contrast"],
    route: "#/tools/color",
    limitations: [
      "Satu tombol salin menyalin semua nilai warna; tidak ada tombol salin per baris.",
      "Tidak mendukung nama warna CSS (mis. tomato) atau ruang warna seperti lab()/oklch().",
      "Alpha dipertahankan, tetapi dibulatkan ke 3 desimal.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/color/ColorPage"),
  },
  {
    id: "number-base",
    name: "Number Base Converter",
    description: "Konversi biner, oktal, desimal, dan heksadesimal dengan BigInt tanpa kehilangan presisi.",
    category: "utilities",
    keywords: ["number", "base", "binary", "octal", "decimal", "hex", "bigint"],
    route: "#/tools/number-base",
    limitations: [
      "Satu tombol salin menyalin semua basis sekaligus sebagai teks berlabel.",
      "Input negatif direpresentasikan dengan tanda minus, bukan two's complement.",
      "Basis selain 2/8/10/16 tidak didukung di MVP.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/number-base/NumberBasePage"),
  },
  {
    id: "jwt",
    name: "JWT Decoder (decode saja)",
    description:
      "Baca header dan payload JWT. Signature tidak pernah diverifikasi dan tool ini tidak menerima kunci apa pun.",
    category: "utilities",
    keywords: ["jwt", "token", "decode", "jose", "jws", "claims", "bearer"],
    route: "#/tools/jwt",
    limitations: [
      "Satu tombol salin menyalin payload; header dan payload tetap tampil berdampingan.",
      "Tidak memverifikasi signature: token palsu pun akan tampil.",
      "Tidak menerima secret atau public key — decode bukan verifikasi.",
      "Tidak memeriksa iss/aud/certificate chain, dan JWE (5 bagian) tidak didukung.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/jwt/JwtPage"),
  },
];

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export interface CategoryGroup {
  category: ToolCategory;
  label: string;
  tools: ToolMeta[];
}

/** Grup kategori berurutan; kategori tanpa anggota tidak dirender (IA §1). */
export function toolsByCategory(): CategoryGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    tools: TOOLS.filter((tool) => tool.category === category),
  })).filter((group) => group.tools.length > 0);
}

export function isToolCategory(value: string): value is ToolCategory {
  return (CATEGORY_ORDER as readonly string[]).includes(value);
}

/**
 * Pencarian tools (IA §7): skor name (3) > keywords (2) > description (1),
 * tie-break alfabetis.
 */
export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLocaleLowerCase();
  if (q === "") return [...TOOLS];

  const scored = TOOLS.map((tool) => {
    let score = 0;
    if (tool.name.toLocaleLowerCase().includes(q)) score += 3;
    if (tool.keywords.some((keyword) => keyword.toLocaleLowerCase().includes(q))) score += 2;
    if (tool.description.toLocaleLowerCase().includes(q)) score += 1;
    return { tool, score };
  }).filter((entry) => entry.score > 0);

  scored.sort((a, b) => (b.score - a.score) || a.tool.name.localeCompare(b.tool.name));
  return scored.map((entry) => entry.tool);
}
