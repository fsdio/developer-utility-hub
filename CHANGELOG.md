# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/)
dan [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Added — offline mode (ADR-0013)

- **Service worker** (`public/sw.js`): aset ber-hash cache-first, HTML
  network-first dengan fallback cache, sehingga aplikasi terbuka tanpa jaringan.
- **`version.json`** ditulis setiap build berisi `id` (sha256 `index.html`) dan
  `builtAt`. Klien membandingkannya dengan id tersimpan di
  `duh:v1:build-version`: sama → pakai cache, beda → reload sekali.
- **Satu-satunya permintaan jaringan rutin** adalah `version.json` (~70 byte).
- `manifest.webmanifest` + `theme-color` agar bisa dipasang sebagai app.

### Changed — satu form, satu aksi (ADR-0014)

- **Hasil menggantikan isi form** pada Case Converter, Base64, URL Encode, HTML
  Entity, dan String Escape: tidak ada panel hasil kedua, aksi bisa dirangkai
  (encode → decode kembali ke teks asli).
- **Case Converter** memakai sembilan tombol gaya di toolbar di atas form; satu
  tombol salin untuk seluruh halaman (sebelumnya sembilan).
- **Section "Hasil perbandingan" dihapus** dari Text Diff; diff tampil di dalam
  panel Modified. Ringkasan `+n −n ~n` pindah ke header strip hasil.
- **Satu tombol salin per halaman**: tombol salin per baris (UUID, warna) dan per
  bagian (JWT header/payload) dihapus; nama aksesibel menyebut konteksnya.
- Hash, JWT, Number Base, dan Timestamp memakai satu panel + strip hasil inline.

### Changed — hasil inline & escape di formatter (ADR-0012)

- **Hasil pindah ke dalam panel input** pada Text Diff, JSON Diff, JSON Formatter,
  dan XML Formatter. Strip `InlineResult` menempel di bawah textarea dengan label,
  ringkasan `+/−/~`, dan tombol salin sendiri. Section "Hasil" terpisah dihapus.
- **Formatter bisa escape/unescape**: tombol Escape & Unescape pada JSON dan XML
  Formatter, dengan target baru `json-string`, `json-document`, `xml-text`, dan
  `xml-document`. Opsi indentasi/komentar disembunyikan saat mode escape aktif.
- **Unescape JSON tidak lagi memakai `JSON.parse`**: escape ditafsirkan satu per
  satu sehingga teks dengan baris baru nyata tidak lagi gagal, `\uXXXX`
  divalidasi, dan escape tak dikenal dibiarkan apa adanya.

### Changed — sudut siku & form ringkas (ADR-0011)

- **Tidak ada sudut membulat**: semua token `--radius-*` = 0; chip, badge, keyword,
  quick pick, dan tombol menjadi persegi. Dijaga oleh `design-guards.test.ts`.
- **Form tanpa teks pengapit**: `CodeArea` dan `FieldLabel` tidak lagi merender
  label terlihat; placeholder + judul panel memberi konteks, nama aksesibel tetap
  ada lewat `sr-only` + `aria-describedby`.
- **Input mengisi panel** (`.field-body`), tinggi minimum panel turun ke 200 px
  sehingga input dan hasil sering terlihat dalam satu layar.
- **Teks berlebih dihapus**: indikator privasi di hero (pindah ke footer), label
  "Cepat:" pada swatch, "ATAU TULIS KODE WARNA", dan paragraf panjang di bawah
  hasil UUID/JWT.
- **Tanpa bayangan dekoratif dan tanpa gerak**: kartu/panel memakai border, hover
  kartu tidak lagi mengangkat atau menambah bayangan.

### Changed — refresh visual & UX (ADR-0010)

- **Kartu dan panel membulat** dengan skala radius baru (12/16/20 px); kartu katalog
  memakai `--radius-xl` + `--shadow-2`, bukan sudut 10 px yang terasa kaku.
- **Hierarki empat tingkat permukaan**: latar halaman → kartu katalog (dengan kicker
  aksen) → panel kerja (dengan header berlabel) → kotak informasi (`bg-sunken`,
  garis tepi kiri). Tidak lagi "semua kotak sama".
- **Diff bergaya `git diff`**: nomor baris kiri/kanan, penanda `+`/`−`/`~`, tepi
  berwarna tegas, gutter bernomor, sorotan karakter, ringkasan berupa pill, dan
  legenda warna. Warna selalu berpasangan dengan teks, tidak berdiri sendiri.
- **Color Converter memilih warna, bukan mengetik**: pemilih warna native 84 px,
  swatch preset 24 px, dan tiap baris hasil punya tombol salin + pemilih warna mini.
- **Beranda lebih cepat dipakai**: pintasan "Paling sering dipakai", pencarian
  katalog, bagian "Terakhir kamu buka" (maks 6 id tool), filter berlabel jumlah.
- **Navigasi antar tool**: halaman tool menampilkan tool lain di kategori yang sama.

### Fixed

- Teks hero menyebut "Lima tool inti" padahal registry sudah 15 tool.
- Tombol salin di baris hasil warna punya nama aksesibel yang sama; kini tiap
  tombol menyebut konteksnya ("Salin nilai HEX ke clipboard").
- Lint: komentar `eslint-disable` untuk aturan `react-hooks/exhaustive-deps` yang
  tidak terpasang, diganti pola `useRef` agar tetap benar tanpa mematikan aturan.

## [Unreleased]

### Added — Phase 5 (kategori `utilities`, ADR-0007)

- 9 tool baru, tanpa dependency tambahan:
  - **Base64 Encode/Decode** — UTF-8 aman, varian standar & URL-safe, wrap 76 karakter.
  - **URL Encode/Decode** — mode komponen (`%20`) dan form (`+`), pesan error berposisi.
  - **HTML Entity Encode/Decode** — named + numerik, tanpa `innerHTML`.
  - **String Escape/Unescape** — JSON, JavaScript, HTML, SQL, XML.
  - **UUID Generator** — v4 acak & v7 berurutan waktu via Web Crypto.
  - **Hash Generator** — SHA-256/512/1, hex + base64, penanganan Web Crypto tidak tersedia.
  - **Unix Timestamp Converter** — UTC + lokal + relatif, validasi tanggal mustahil.
  - **Color Converter** — HEX/RGB/HSL dua arah, pratinjau, penentuan warna teks.
  - **Number Base Converter** — biner/oktal/desimal/heksadesimal dengan BigInt.
  - **JWT Decoder** — decode saja dengan peringatan tiga lapis, peringatan keras untuk
    `alg: none`, penolakan JWE, dan status claim waktu tanpa kata "valid" (ADR-0009).
- ADR-0007 (cakupan Phase 5), ADR-0008 (Regex Tester ditunda), dan ADR-0009
  (JWT decode-only, tanpa input kunci).
- Navigasi header & filter beranda kini menampilkan kategori `Utilities`.
- Test: 148 test baru (unit engine, component, a11y untuk semua halaman,
  registry-load, perluasan audit privasi).
- Skrip `check-boundaries` diperluas ke `lib/encoding` dan `lib/dev`;
  `check-bundle` kini menghitung minimum 14 chunk tool.

## [0.1.0] — 2026-11-12

### Added

- Blueprint v2: normalisasi tabel & list Markdown, koreksi `base` Vite ke nama
  repository sebenarnya, penetapan lisensi MIT, penghapusan referensi Spring Boot.
- Artefak engineering: `PRD.md`, `information-architecture.md`, `ui-specification.md`,
  `technical-design.md`, `backlog.md`, serta ADR-0001..0006.
- Fondasi aplikasi: React 19 + TypeScript 5.9 + Vite 8, design tokens light/dark,
  hash router, tool registry, pencarian tool dengan `Ctrl/Cmd+K`, error boundary,
  halaman Community/Privacy/404.
- Lima tool MVP:
  - Case Converter (9 gaya, aturan tokenisasi sesuai ADR-0001, copy per gaya).
  - JSON Formatter (format/minify/validasi, error baris & kolom dengan cuplikan).
  - XML Formatter (serializer sendiri, komentar & PI dipertahankan, mixed content aman).
  - Text Diff (diff baris + highlight karakter, opsi ignore, swap, copy/download unified).
  - JSON Diff (struktural, JSON Pointer, tampilan patch RFC 6902).
- Batas input 1.000.000 karakter (ADR-0005) dengan state over-limit.
- Kualitas: ESLint 10 + typescript-eslint, Vitest + RTL, audit privasi otomatis,
  audit aksesibilitas (axe), skrip batas modul, budget bundle, verifikasi kontras AA,
  smoke test base path GitHub Pages.
- CI: lint/typecheck/test/build/checks + deploy GitHub Pages dengan `.nojekyll`
  dan `404.html`.
