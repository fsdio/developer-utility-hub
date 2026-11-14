/**
 * Tool registry — satu-satunya sumber metadata tools (technical-design §3).
 * Navigasi, katalog, pencarian, dan route membaca dari sini.
 */
import type { ComponentType } from "react";

/**
 * Kategori = pengelompokan menurut tugas yang sedang dikerjakan pengguna
 * (ADR-0019), bukan menurut jenis berkas. Enam kategori ini dipilih supaya
 * setiap grup langsung menjawab "saya mau apa", bukan "tool ini masuk folder
 * mana".
 */
export type ToolCategory = "text" | "formatter" | "diff" | "encoding" | "auth" | "convert";
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
  text: "Teks",
  formatter: "Formatter",
  diff: "Diff",
  encoding: "Encode & Decode",
  auth: "Auth & Token",
  convert: "Konversi",
};

/** Satu kalimat penjelas per kategori — dipakai katalog sebagai subjudul grup. */
export const CATEGORY_HINTS: Record<ToolCategory, string> = {
  text: "Mengubah bentuk teks biasa.",
  formatter: "Merapikan, memvalidasi, dan meng-escape data terstruktur.",
  diff: "Membandingkan dua dokumen dan menandai perbedaannya.",
  encoding: "Beralih antara teks, URL, entitas HTML, dan Base64/berkas.",
  auth: "Membaca, memverifikasi, dan membuat kredensial token.",
  convert: "Mengubah satuan nilai: waktu, warna, basis angka, dan ID.",
};

/** Urutan kategori yang stabil di seluruh UI. */
export const CATEGORY_ORDER: readonly ToolCategory[] = [
  "text",
  "formatter",
  "diff",
  "encoding",
  "auth",
  "convert",
];

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
    category: "encoding",
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
    id: "image-base64",
    name: "Gambar ⇄ Base64",
    description:
      "Ubah gambar (PNG, JPEG, GIF, WEBP, SVG, BMP, AVIF) menjadi Base64 dan kembalikan Base64 menjadi berkas gambar.",
    category: "encoding",
    keywords: ["image", "gambar", "base64", "png", "jpeg", "svg", "webp", "data url", "encode", "decode"],
    route: "#/tools/image-base64",
    limitations: [
      "Berkas dibaca langsung dari perangkat Anda; tidak ada unggahan dan tidak ada permintaan jaringan.",
      "Batas 20 MB per berkas agar tab tidak kehabisan memori; Base64 menambah sekitar 33% ukuran.",
      "Jenis berkas ditentukan dari magic bytes, bukan nama berkasnya.",
      "Menempel Base64 yang salah ke tool ini selalu ditolak walau datanya valid untuk tool lain.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/image-base64/ImageBase64Page"),
  },
  {
    id: "pdf-base64",
    name: "PDF ⇄ Base64",
    description:
      "Ubah berkas PDF menjadi Base64 (atau data URL) dan kembalikan Base64 menjadi berkas PDF yang bisa diunduh.",
    category: "encoding",
    keywords: ["pdf", "base64", "data url", "encode", "decode", "dokumen", "attachment"],
    route: "#/tools/pdf-base64",
    limitations: [
      "Dokumen dibaca langsung dari perangkat Anda; tidak ada unggahan dan tidak ada permintaan jaringan.",
      "Batas 20 MB per berkas agar tab tidak kehabisan memori; Base64 menambah sekitar 33% ukuran.",
      "Tidak memvalidasi isi PDF di luar tanda tangan %PDF di awal berkas.",
      "Pratinjau memakai penampil PDF bawaan browser; bila tidak ada, berkas tetap bisa diunduh.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/pdf-base64/PdfBase64Page"),
  },
  {
    id: "url-encoder",
    name: "URL Encode / Decode",
    description: "Percent-encoding untuk query string dan path, termasuk gaya form dengan tanda +.",
    category: "encoding",
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
    category: "encoding",
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
    category: "encoding",
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
    category: "convert",
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
    category: "auth",
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
    category: "convert",
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
    category: "convert",
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
    category: "convert",
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
    category: "auth",
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
  {
    id: "jwt-verify",
    name: "JWT Verifier (dengan kunci)",
    description:
      "Periksa signature JWT dengan secret atau kunci publik yang kamu tempel, lalu audit klaim exp/nbf/iss/aud.",
    category: "auth",
    keywords: ["jwt", "verify", "signature", "hs256", "rs256", "es256", "verify token", "claims", "audit"],
    route: "#/tools/jwt-verify",
    limitations: [
      "Hanya memakai kunci yang kamu tempel; tool tidak mengambil JWKS atau memercayai penerbit mana pun.",
      "Kunci HMAC diperlakukan sebagai teks UTF-8; kunci asimetris harus PEM PUBLIC KEY (SPKI), bukan kunci privat.",
      "exp/nbf dibandingkan dengan jam perangkat, jadi selisih jam bisa mengubah hasil.",
      "iss/aud hanya dicocokkan dengan nilai yang kamu ketik sendiri.",
      "JWE (5 bagian) dan JWS bersarang tidak didukung.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/jwt-verify/JwtVerifyPage"),
  },
  {
    id: "basic-auth",
    name: "Basic Auth Encode / Decode",
    description:
      "Ubah username dan password menjadi header Authorization Basic, atau pecah header Basic kembali menjadi kredensial.",
    category: "auth",
    keywords: ["basic auth", "authorization", "base64", "header", "http auth", "credential"],
    route: "#/tools/basic-auth",
    limitations: [
      "Basic Auth hanya Base64, bukan enkripsi: isi header selalu bisa dibaca siapa pun.",
      "Username dan password di-encode sebagai UTF-8; server lama yang memakai Latin-1 bisa menghasilkan nilai berbeda.",
      "Hasil decode mengikuti pemisah titik dua pertama, dan password yang memuat titik dua tetap utuh.",
      "Satu tombol salin menyalin header Authorization, bukan kredensial terpisah.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/basic-auth/BasicAuthPage"),
  },
  {
    id: "api-key",
    name: "API Key Generator",
    description:
      "Buat token acak kriptografis dengan awalan opsional, lalu hitung sidik jari SHA-nya untuk verifikasi tanpa menyimpan token asli.",
    category: "auth",
    keywords: ["api key", "token", "secret", "random", "generator", "fingerprint", "sha256", "entropy"],
    route: "#/tools/api-key",
    limitations: [
      "Token hanya ada di memori tab; menutup tab menghapusnya tanpa jejak.",
      "Entropi dihitung dari bagian acak saja; awalan yang kamu ketik tidak menambah entropi.",
      "Sidik jari SHA-1 disediakan hanya untuk sistem lama, bukan pilihan untuk kunci baru.",
      "Tool tidak menyimpan, mengirim, atau mencadangkan token — salin sebelum menutup tab.",
    ],
    status: "stable",
    load: () => import("@/features/utilities/api-key/ApiKeyPage"),
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
