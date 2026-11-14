# UI Specification — Developer Utility Hub

> Turunan blueprint §15 langkah 3. Mengunci layout, komponen, design tokens,
> responsive behavior, dan states. Arah: **compact-medium**, nuansa tooling
> open-source, bukan dashboard SaaS. Animasi minimal. Light & dark.

---

## 1. Design tokens

Semua nilai di bawah menjadi custom properties di `src/styles/tokens.css`.
Tidak ada nilai warna/spacing hard-coded di komponen.

### 1.1 Warna (light / dark)

| Token | Light | Dark | Dipakai untuk |
|---|---|---|---|
| `--bg` | `#fbfbfa` | `#0f1115` | latar halaman |
| `--bg-raised` | `#ffffff` | `#161a21` | panel, kartu |
| `--bg-sunken` | `#f2f2ef` | `#0a0c10` | editor, code block |
| `--border` | `#dcdcd6` | `#2a3038` | garis panel, pemisah |
| `--border-strong` | `#c3c3bb` | `#3a424d` | fokus ring non-aktif, garis tabel |
| `--fg` | `#1b1d1f` | `#e6e8eb` | teks utama |
| `--fg-muted` | `#5c6166` | `#9aa2ad` | deskripsi, label |
| `--fg-subtle` | `#878c92` | `#6b7280` | hint, metadata |
| `--accent` | `#2563eb` | `#6ea8fe` | tautan, aksi utama |
| `--accent-fg` | `#ffffff` | `#0f1115` | teks di atas accent |
| `--added-bg` | `#e6f6ec` | `#102b1c` | baris diff ditambah |
| `--added-fg` | `#14532d` | `#7ee2a8` | teks diff ditambah |
| `--removed-bg` | `#fdeaea` | `#331416` | baris diff dihapus |
| `--removed-fg` | `#7f1d1d` | `#f4a3a3` | teks diff dihapus |
| `--changed-bg` | `#fdf5e0` | `#2e2510` | baris berubah |
| `--changed-fg` | `#713f12` | `#e8c97a` | teks berubah |
| `--danger` | `#b42318` | `#f97066` | error |
| `--success` | `#067647` | `#4ade80` | status copy berhasil |

**Bentuk (ADR-0011):** semua token `--radius-*` bernilai **0** — UI memakai sudut
siku di seluruh permukaan. Input tunggal memakai `.field-body` tanpa label terlihat;
label dan hint untuk pembaca layar dihubungkan lewat `sr-only` + `aria-describedby`.

Token tambahan (ADR-0010): `--surface-hover`, `--surface-active`, `--focus-ring`,
`--added/removed/changed-gutter`, `--added/removed/changed-edge`,
`--added/removed/changed-mark`, `--shadow-2`, `--shadow-3`, serta skala radius
`--radius-xs` 6 / `--sm` 8 / `--md` 12 / `--lg` 16 / `--xl` 20 / `--pill` 999.

Kontras minimum: 4.5:1 untuk teks normal, 3:1 untuk teks ≥18,66 px bold / ≥24 px
dan untuk batas komponen (WCAG 2.2 AA). Pasangan di atas dipilih agar lolos di
kedua tema; nilai diuji dengan `scripts/check-contrast.mjs` (bagian dari CI).

### 1.2 Tipografi

| Token | Nilai |
|---|---|
| `--font-sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| `--font-mono` | `ui-monospace, "SFMono-Regular", "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace` |
| `--text-xs` | 12 px / 1.5 |
| `--text-sm` | 13 px / 1.55 |
| `--text-base` | 14 px / 1.6 |
| `--text-lg` | 16 px / 1.5 |
| `--text-xl` | 20 px / 1.3 |
| `--text-2xl` | 26 px / 1.2 |

Ukuran dasar **14 px** (bukan 16) untuk kepadatan: ini aplikasi kerja, bukan artikel.
Editor dan output selalu memakai `--font-mono` pada 13 px.

### 1.3 Spacing, radius, shadow, motion

- Spacing scale 4 px: `--space-1..8` = 4, 8, 12, 16, 24, 32, 48, 64.
- Radius: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 10px`.
- Shadow: hanya `--shadow-1` untuk dropdown/popover (`0 4px 16px rgb(0 0 0 / .12)`).
  Panel tidak memakai shadow.
- Motion: durasi 120 ms, easing `ease-out`, **hanya** untuk opacity dan warna.
  Semua transisi dimatikan di bawah `prefers-reduced-motion: reduce`.
- Tidak ada animasi masuk/keluar halaman, tidak ada skeleton shimmer.

### 1.4 Layout

| Token | Nilai |
|---|---|
| `--header-h` | 56 px |
| `--container-max` | 1180 px |
| `--panel-min-h` | 240 px (desktop), 180 px (mobile) |
| Breakpoint | `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` |

---

## 2. Komponen

Daftar komponen bersama (di `src/components/`). Nama file = nama komponen.

### 2.1 `AppShell`
Header sticky + `<main>` + footer. Menyediakan skip-link "Langsung ke konten".

### 2.2 `Header`
Logo (SVG inline, `aria-hidden`) + wordmark + `nav` kategori + `ToolSearch` +
`ThemeToggle` + tautan GitHub. Di < 768 px: wordmark pendek, kategori jadi
baris tab yang dapat digeser.

### 2.3 `ToolSearch`
`<input type="search" role="combobox" aria-expanded aria-controls>` +
`<ul role="listbox">`. `Ctrl/Cmd+K` fokus dari mana pun (kecuali sedang mengetik
di editor). Hasil maks 6. Mencocokkan registry (IA §7).

### 2.4 `ThemeToggle`
Tombol siklus 3 state (light/dark/system) dengan ikon + `aria-label` yang
menyebut state berikutnya. Preferensi `duh:v1:theme`.

### 2.5 `ToolCard`
`<a>` utuh: nama (`--text-lg`, medium), deskripsi (`--fg-muted`, 2 baris maks
dengan `line-clamp`), 3 chip kata kunci. Hover: border `--border-strong`, tanpa
transform. `status: planned` → bukan tautan, diberi label "Segera".

### 2.6 `Panel`
Kontainer kerja: header tipis (label kiri, aksi kanan), body, footer opsional.
Props: `label`, `actions`, `footer`, `tone` (`default | error`).

### 2.7 `CodeArea`
Textarea terkontrol dengan `font-mono`, `spellcheck=false`, `autocapitalize=off`,
`wrap=off` untuk diff/format. Menampilkan:
- placeholder yang menjelaskan format yang diharapkan,
- counter karakter di footer (dan peringatan bila > 90 % batas),
- `aria-describedby` ke hint/error message.

### 2.8 `Toolbar`
Baris aksi: `Button` primer (aksi utama), grup opsi (`Checkbox`/`Radio`/`Select`),
lalu `CopyButton`, `ResetButton`, `DownloadButton` di kanan. Membungkus ke baris
baru di < 768 px.

Aksi yang setara (mis. `Encode`/`Decode`, sembilan gaya case) dibungkus
`.action-group` (`role="group"`, `aria-label`), setiap tombol memakai
`aria-pressed` untuk menandai mode aktif. Tautan contoh di dalam kalimat memakai
`.link-button`, bukan tombol tersendiri (ADR-0014).

### 2.9 `CopyButton`
Menyalin hasil; label berubah `Copy → Tersalin` selama 1,5 s atau `Gagal menyalin`
bila clipboard ditolak. Memakai `aria-live="polite"` pada status.

**Maksimal satu per halaman** (ADR-0014). Prop `context` mengisi nama aksesibel
("Salin semua basis ke clipboard") sehingga jelas apa yang tersalin; teks tombol
tetap `Copy`. Tidak ada tombol salin per baris atau per bagian.

### 2.10 `StatusMessage`
`role="status"` (sukses/info) atau `role="alert"` (error). Tiga tone:
`info`, `success`, `error`. Error formatter memuat blok `pre` berisi cuplikan
baris + penanda `^`.

### 2.11 `DiffView`
Daftar baris; tiap baris: nomor kiri, nomor kanan, sign (`+`/`-`/` `), konten.
Tone dari token `--added-*`, `--removed-*`, `--changed-*`. Highlight karakter
memakai `<mark>` dengan background lebih pekat. Mode dua kolom (`lg+`) dengan
scroll sinkron; mode satu kolom di bawahnya.

### 2.12 `EmptyState`
Ikon opsional + 1 kalimat petunjuk + contoh singkat yang dapat diklik
(mengisi input dengan contoh). Contoh **tidak** boleh berisi data sensitif nyata.

### 2.12b `FileDropZone`
Area bergaris putus-putus untuk memilih atau menjatuhkan satu berkas
(ADR-0017). Isinya: satu kalimat petunjuk, tombol **Pilih berkas**, dan daftar
format + batas ukuran dalam teks mono kecil. Saat berkas diseret di atasnya,
latar berubah (`--bg-sunken`) dan garis tepi menjadi `--accent`. Berkas yang
terlalu besar ditolak dengan `role="alert"` di bawah area, tanpa mengubah apa pun.

Pratinjau hasil decode memakai `<img>` (gambar) atau `<object type="application/pdf">`
(PDF), dengan tinggi maksimum 52vh.

### 2.13 `Kbd`
Penanda tombol keyboard (`Ctrl`/`K`), dipakai di search dan hint toolbar.

---

## 3. Layout halaman tool

### Desktop (≥ 1024 px)

```
┌─────────────── Header (56) ──────────────────────────────┐
├──────────────────────────────────────────────────────────┤
│ Breadcrumb                                               │
│ H1 Nama tool                    [badge kategori]         │
│ Deskripsi satu kalimat                                   │
│ ┌ Toolbar ────────────────────────────────────────────┐  │
│ │ [Aksi utama]  [opsi …]        [Copy] [Reset] [Unduh] │  │
│ └──────────────────────────────────────────────────────┘  │
│ ┌ Panel input ───────────────────────────────────────┐  │
│ │ [isi form — hasil menggantikan isi]                │  │
│ │ ┌ strip hasil inline ────────────────────────────┐ │  │
│ │ │ label · aksi salin · isi hasil                 │ │  │
│ │ └────────────────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────────────┘  │
│ Catatan keterbatasan                                     │
└──────────────────────────────────────────────────────────┘
```

Grid dua kolom `minmax(0,1fr) minmax(0,1fr); gap: 16px` hanya dipakai tool yang
memang membandingkan dua masukan (Text Diff, JSON Diff). Tool satu-input memakai
satu panel (`.tool-grid--single` / `Panel stacked`): hasil tampil sebagai strip
`InlineResult` di dalam panel yang sama (ADR-0012, ADR-0014). Kolom
`minmax(0,…)` wajib agar textarea tidak meledak lebarnya.

### Tablet (768–1023 px)

Dua panel tetap berdampingan hanya untuk Text Diff dan JSON Diff (butuh
perbandingan langsung); tool satu-input sudah satu panel sejak awal. Bagian
bersebelahan di dalam strip hasil (mis. header + payload JWT) menumpuk di bawah
900 px.

### Mobile (< 768 px)

Semua satu kolom. Panel satu-input tetap satu panel; strip hasil inline berada di
bawah isi form, `min-height` panel 180 px. Toolbar membungkus ke beberapa baris
(`.action-group` ikut wrap) agar tombol aksi tidak perlu digulir horizontal.

### Kontrol form (ADR-0020)

Semua kontrol teks memakai satu sistem: latar `--bg-raised`, border 1 px
`--border-strong`, sudut 0, padding `7px 10px`, **tinggi minimum 34 px** sehingga
sejajar dengan tombol di toolbar.

```
┌ Toolbar ─────────────────────────────────────────────────────────────┐
│ [Generate]  Panjang [43 (256 bit) ▾]  Alfabet [Base64URL (64) ▾]     │
│             └ semua kontrol 34 px, chevron --fg-subtle ┘             │
└──────────────────────────────────────────────────────────────────────┘
```

- `select` memakai `appearance: none` + chevron buatan (dua gradien) agar
  warnanya mengikuti tema; opsinya `background: --bg-raised`.
- `textarea` minimal 84 px dan bisa di-resize vertikal; varian
  `.control-input--area` (kunci PEM) memakai font mono `--text-xs`.
- Fokus: `border-color: --accent` + `--focus-ring`; tidak ada outline bawaan.
- Placeholder `--fg-subtle`; kontrol `:disabled` diredupkan + `cursor: not-allowed`.
- Label tetap `sr-only` (ADR-0011); hint tetap `sr-only` lewat
  `aria-describedby`. Tidak ada teks pengapit baru.
- Pengecualian bergaya sendiri: `CodeArea`, kotak cari katalog, combobox
  `Ctrl+K`, input file tersembunyi, dan pemilih warna.

### Katalog berbentuk daftar (ADR-0019)

```
Judul grup  4        subjudul tugas                              [Lipat]
──────────────────────────────────────────────────────────────────────
JSON Formatter      Format, minify, validasi, error berposisi   json  → 
XML Formatter       Format, minify, escape, komentar tetap      xml   → 
──────────────────────────────────────────────────────────────────────
```

- `.tool-list` tanpa border luar, tiap `.tool-row` dipisah 1 px `--border`,
  padding vertikal `--space-2` — tinggi baris ± 28 px, tanpa sudut membulat.
- Grid `.tool-row`: `minmax(160px,15rem) minmax(0,1fr) auto auto`
  (nama · deskripsi · meta · panah). Deskripsi satu baris dengan `ellipsis`
  pada layar lebar; < 760 px ia membungkus dan grid menjadi dua kolom.
- Hover/fokus: latar `--surface-hover`, panah `--accent` muncul. Tidak ada
  shadow, tidak ada `transform` skala.
- Nama tool 600 `--text-sm`; deskripsi `--fg-muted`; kata kunci chip 10 px;
  badge kategori hanya pada hasil pencarian.
- `.category-hint` (subjudul tugas) `--fg-subtle` `--text-xs`.

### Diff (Text Diff & JSON Diff)

```
Judul + toolbar
┌ Panel Original ────┐  ┌ Panel Modified ───┐
│                    │  │ isi + diff inline │
│                    │  │ +n −n ~n (header) │
└────────────────────┘  └───────────────────┘
```

Tidak ada panel/section hasil sama sekali (ADR-0015). Perbedaan disorot
**langsung di dalam kedua form**:

| Panel | Sorotan |
|---|---|
| Original | baris dihapus (merah), baris diubah (kuning + penanda karakter dihapus) |
| Modified | baris ditambah (hijau), baris diubah (kuning + penanda karakter ditambah) |

Ringkasan `+n −n ~n` berada di footer panel Modified. Textarea tetap satu-satunya
elemen yang dapat diedit; sorotan adalah lapisan `aria-hidden` di belakangnya
yang ikut bergulir, dan setiap baris membawa label `sr-only`. Nomor baris
ditampilkan di kiri kedua panel. `Copy diff` menyalin bentuk unified untuk
pengguna pembaca layar.

Formatter (JSON/XML) mengikuti aturan yang sama: `Format`, `Minify`, `Escape`,
dan `Unescape` menggantikan isi form; `Validasi` hanya melaporkan ringkasan atau
error di bawah panel, bukan hasil di panel terpisah.

---

## 4. States

Setiap tool wajib mendefinisikan keadaan berikut; tidak boleh ada state yang
tidak punya tampilan.

| State | Tampilan |
|---|---|
| **Empty** | `EmptyState` di panel output dengan contoh yang bisa diklik |
| **Processing** | Hanya bila > 150 ms: label kecil "Memproses…" di header panel output; tombol aksi disabled |
| **Success** | Output terisi; tidak ada banner sukses (jangan berisik) |
| **Input invalid** | Panel input `tone="error"`, `StatusMessage` error di bawah toolbar, output dikosongkan |
| **Over limit** | `StatusMessage` peringatan + tombol Reset; pemrosesan berhenti |
| **Clipboard denied** | Label tombol "Gagal menyalin" + hint "Pilih teks dan tekan Ctrl+C" |
| **Downloaded** | Label sementara "Terunduh" |
| **Nothing to copy** | `CopyButton` disabled dengan `title` penjelas |
| **Route 404** | Halaman 404 dengan pencarian dan daftar tool |
| **Chunk load error** | Fallback error boundary: pesan "Gagal memuat tool, muat ulang halaman" + tombol Reload |

---

## 5. Aksesibilitas (mengikat)

1. **Struktur**: satu `<h1>` per halaman; heading berurutan tanpa lompat level.
2. **Keyboard**: semua kontrol reachable via `Tab`; urutan fokus mengikuti urutan visual;
   `:focus-visible` memakai outline 2 px `--accent` dengan offset 2 px (tidak pernah
   `outline: none` tanpa pengganti).
3. **Label**: tiap textarea punya `<label>` terlihat, bukan hanya placeholder.
   Placeholder tidak boleh menjadi satu-satunya label.
4. **Status**: semua perubahan status async diumumkan lewat `role="status"` /
   `role="alert"` yang sudah ada di DOM (bukan dibuat saat itu).
5. **Warna bukan satu-satunya penanda**: baris diff juga memakai sign `+`/`-` dan
   nomor baris; badge error memakai ikon + teks.
6. **Diff dapat dibaca screen reader**: tiap baris punya teks tersembunyi
   ("ditambahkan", "dihapus", "diubah") via `.sr-only`.
7. **Kontras**: minimal AA di kedua tema; diverifikasi di CI.
8. **Reduced motion**: seluruh transisi dimatikan.
9. **Zoom 200 %**: tidak ada konten yang terpotong; layout mengalir satu kolom.
10. **Bahasa**: `<html lang="id">`; istilah teknis Inggris dipertahankan sesuai PRD §4.2.

---

## 6. Microcopy

| Konteks | Teks |
|---|---|
| Indikator privasi | "100% di browser" di footer situs (bukan di samping judul hero) |
| Catatan JSON | "Angka di atas 2^53 bisa kehilangan presisi; key duplikat: yang terakhir menang." |
| Catatan XML | "Formatter ini merapikan struktur, bukan penjamin round-trip. CDATA ditulis ulang sebagai teks." |
| Catatan JSON Diff | "Patch bersifat deskriptif, tidak dijamin bisa di-apply." |
| Batas input | "Input melebihi 1.000.000 karakter. Perkecil input untuk memproses." |
| Copy gagal | "Browser menolak akses clipboard. Pilih teks lalu tekan Ctrl+C." |

Nada: langsung, tanpa seru, tanpa emoji, tanpa tanda seru berlebihan.

---

## 7. Traceability

| Blueprint | Dokumen ini |
|---|---|
| §5 prinsip visual & "hindari" | §1, §3 (tanpa dashboard, tanpa kartu dekoratif, animasi minimal) |
| §5 perilaku umum tool | §2.7–2.10, §4 |
| §5 dark/light & responsif | §1.1, §3 |
| §5 "jangan paksakan komponen sama" | §2 (CodeArea vs input satu baris; DiffView terpisah) |
| §7 privasi di UI | §6 microcopy, halaman Privacy |
| §12 acceptance criteria | §5 aksesibilitas, §4 states |
