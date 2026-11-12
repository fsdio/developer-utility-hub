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
      "Akronim tidak dipertahankan: userID menjadi userId.",
      "Diakritik tidak dinormalisasi: café tetap café.",
    ],
    status: "stable",
    load: () => import("@/features/text/case-converter/CaseConverterPage"),
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, minify, dan validasi JSON dengan pesan error yang menunjukkan baris dan kolom.",
    category: "formatter",
    keywords: ["json", "format", "beautify", "minify", "validate", "pretty"],
    route: "#/tools/json-formatter",
    limitations: [
      "Angka di atas 2^53 bisa kehilangan presisi (batasan Number).",
      "Key duplikat: yang terakhir menang.",
    ],
    status: "stable",
    load: () => import("@/features/data/json-formatter/JsonFormatterPage"),
  },
  {
    id: "xml-formatter",
    name: "XML Formatter",
    description: "Format dan minify XML, dengan komentar dan processing instruction yang dipertahankan.",
    category: "formatter",
    keywords: ["xml", "format", "beautify", "minify", "well-formed", "namespace"],
    route: "#/tools/xml-formatter",
    limitations: [
      "Bukan penjamin round-trip: CDATA ditulis ulang sebagai teks ter-escape.",
      "DTD dan entity kustom tidak didukung; akan dilaporkan sebagai error parse.",
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
    ],
    status: "stable",
    load: () => import("@/features/comparison/json-diff/JsonDiffPage"),
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
