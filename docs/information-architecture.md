# Information Architecture — Developer Utility Hub

> Turunan blueprint §15 langkah 2. Mengunci kategori, navigasi, dan struktur halaman.
> Keputusan: **Opsi A** — setiap utility punya halaman/workspace sendiri dengan
> design system dan engine bersama.

---

## 1. Model informasi

```
Developer Utility Hub
├── Beranda (katalog)
│   ├── Pencarian tools (header)
│   └── Grup kategori
│       ├── Text            → Case Converter
│       ├── Formatter       → JSON Formatter, XML Formatter
│       ├── Diff            → Text Diff, JSON Diff
│       └── Utilities       → Base64, URL Encoder, HTML Entity, Escape,
│                             UUID, Hash, Timestamp, Color, Number Base, JWT
├── Halaman tool (15)
├── Community
│   ├── Suggest a Feature   → GitHub Issue (template feature_request)
│   └── Report a Bug        → GitHub Issue (template bug_report)
├── Privacy
├── 404 (tidak dikenal)
└── Utilities
    ├── Toolbar (copy/reset/download)
    ├── Panel input ⇄ panel output
    └── Catatan keterbatasan
```

Kategori blueprint §5 menyebut "Encoder/Utilities". Pada MVP kategori itu kosong
sehingga tidak dirender (menu kosong menyesatkan). Setelah Phase 5 (ADR-0007)
kategori `utilities` berisi 9 tool dan muncul otomatis — perilaku ini memang
dirancang: kategori hanya dirender bila punya anggota.

## 2. Registry sebagai sumber tunggal

Semua metadata tool hidup di `src/registry/tools.ts`:

| Field | Tipe | Dipakai oleh |
|---|---|---|
| `id` | string (slug) | route, test id, localStorage key |
| `name` | string | kartu katalog, header tool, `<title>` |
| `description` | string (1 kalimat) | kartu, meta description |
| `category` | `"text" \| "formatter" \| "diff" \| "utilities"` | grup katalog, navigasi, filter beranda |
| `keywords` | string[] | pencarian |
| `route` | string (hash) | router |
| `limitations` | string[] | catatan di halaman tool |
| `status` | `"stable" \| "planned"` | katalog (`planned` tampil non-klik) |
| `load` | `() => Promise<{default: Component}>` | lazy route |

Navigasi, katalog, pencarian, dan sitemap semuanya membaca registry ini.
Tidak ada daftar tool kedua di tempat lain.

## 3. Struktur URL (hash routing)

| URL | Halaman |
|---|---|
| `#/` | Beranda / katalog |
| `#/tools/case-converter` | Case Converter |
| `#/tools/json-formatter` | JSON Formatter |
| `#/tools/xml-formatter` | XML Formatter |
| `#/tools/text-diff` | Text Diff |
| `#/tools/json-diff` | JSON Diff |
| `#/tools/base64` | Base64 Encode / Decode |
| `#/tools/url-encoder` | URL Encode / Decode |
| `#/tools/html-entity` | HTML Entity Encode / Decode |
| `#/tools/escape` | String Escape / Unescape |
| `#/tools/uuid` | UUID Generator |
| `#/tools/hash` | Hash Generator (SHA) |
| `#/tools/timestamp` | Unix Timestamp Converter |
| `#/tools/color` | Color Converter |
| `#/tools/number-base` | Number Base Converter |
| `#/tools/jwt` | JWT Decoder (decode saja) |
| `#/tools/<tidak-dikenal>` | 404 |
| `#/community` | Community |
| `#/privacy` | Privacy |
| `#/tools` | Beranda (alias) |

Aturan:

- Path memakai hash agar aman di GitHub Pages tanpa server rewrite.
- **Query string tidak pernah membawa isi input.** Tidak ada `#/tools/json-formatter?data=...`.
  Ini keputusan privasi (PRD §3), bukan keterbatasan teknis.
- Route tak dikenal → halaman 404 dengan pencarian dan daftar semua tool.
- `document.title` = `<Nama tool> · Developer Utility Hub`.

## 4. Navigasi

### Header (tinggi 56 px, sticky)

| Elemen | Perilaku |
|---|---|
| Logo + nama | Klik → beranda |
| Kategori (Teks · Formatter · Diff · Encode & Decode · Auth & Token · Konversi) | Klik → beranda terfilter ke kategori tsb. (`#/?kategori=formatter` berupa state UI, bukan isi dokumen). Daftar dibaca dari `CATEGORY_ORDER` di registry (ADR-0019) |
| Pencarian tools | Input dengan `Ctrl/Cmd+K` fokus; hasil dropdown (maks 6) di bawah input |
| Tautan GitHub | `aria-label="Buka repositori di GitHub"` |
| Theme switcher | Siklus `light → dark → system` |

### Navigasi mobile (< 768 px)

Header tetap: logo + tombol pencarian (ikon) + theme. Kategori menjadi tab
horizontal yang dapat digeser di bawah header, atau disembunyikan di beranda
karena beranda sudah punya filter kategori. Tidak ada hamburger menu di MVP —
jumlah halaman terlalu sedikit untuk membutuhkannya.

### Breadcrumb

Hanya di halaman tool: `Beranda / <Kategori> / <Nama tool>`. Breadcrumb tidak
ditampilkan di mobile (sudah ada "← Semua tools" di atas judul).

## 5. Halaman beranda

Urutan blok:

1. **Hero ringkas** (1 heading + 1 kalimat + jumlah tool + catatan berjalan di perangkat).
2. **Pintasan** "Paling sering dipakai" lalu "Terakhir kamu buka" (bila ada).
3. **Kontrol katalog**: chip filter kategori + kotak cari, satu baris.
4. **Grup kategori** (ADR-0019): judul + hitungan + subjudul tugas + tombol
   `Lipat`/`Buka`, lalu **daftar baris** `ToolRow` (nama · deskripsi satu baris ·
   kata kunci · panah saat hover). Enam grup menurut tugas: Teks, Formatter,
   Diff, Encode & Decode, Auth & Token, Konversi.
5. **Blok Community**: dua baris tautan (fitur/bug) + catatan bahwa keduanya lewat GitHub Issues.
6. **Footer**: versi, tautan Privacy, lisensi MIT.

Baris tool adalah `<a>` penuh di dalam `<li>` (bukan div dengan onClick) agar bisa
dibuka di tab baru dan diakses keyboard. Hasil pencarian memakai baris yang sama,
dengan badge kategori.

## 6. Halaman tool

Tata letak seragam (lihat `docs/ui-specification.md` untuk detail visual):

```
Breadcrumb
Judul + deskripsi + badge kategori
[Toolbar: aksi utama · opsi · copy · reset · download]
[Panel input | Panel output]      ← 2 kolom ≥1024 px, 1 kolom di bawahnya
[Catatan keterbatasan]
```

Untuk Text Diff dan JSON Diff: dua panel input berdampingan (≥1024 px), hasil diff
di bawahnya sebagai satu panel penuh.

## 7. Pencarian

- Mencocokkan `name`, `description`, `keywords` (case-insensitive, substring).
- Skor: cocok di `name` (3) > `keywords` (2) > `description` (1); tie-break alfabetis.
- Kosong → tampilkan semua tool.
- Navigasi hasil dengan `↑`/`↓`, buka dengan `Enter`, tutup dengan `Escape`.
- Tidak ada pencarian lintas-konten (tidak mengindeks isi input).

## 8. Halaman pendukung

| Halaman | Isi |
|---|---|
| Community | Dua kartu aksi ke GitHub Issues + penjelasan apa yang harus disertakan. Tanpa form lokal (tidak ada backend). |
| Privacy | Daftar data yang **tidak** dikirim/di simpan, daftar preferensi localStorage + cara menghapusnya. |
| 404 | Pesan singkat, pencarian, daftar semua tool. |

## 9. Traceability

| Blueprint | Dokumen ini |
|---|---|
| §5 navigasi & workspace | §4, §6 |
| §5 Opsi A (rekomendasi) | Keputusan di header dokumen |
| §5 search & discovery | §7 |
| §6 tool registry | §2 |
| §6 struktur folder | `technical-design.md` §3 |
| §8 community | §8 |
| §10 hash routing | §3 |
