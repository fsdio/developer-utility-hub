# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/)
dan [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

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
