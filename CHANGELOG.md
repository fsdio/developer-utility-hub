# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/)
dan [Semantic Versioning](https://semver.org/lang/id/).

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
- ADR-0007 (cakupan Phase 5) dan ADR-0008 (Regex Tester ditunda beserta prasyarat).
- Navigasi header & filter beranda kini menampilkan kategori `Utilities`.
- Test: 119 test baru (unit engine, component, a11y untuk semua halaman,
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
