# Backlog — Developer Utility Hub

> Turunan blueprint §15 langkah 5. Task terurut, dengan estimasi kompleksitas.
> Skala: **XS** ≤ 1 jam · **S** ≈ 2–4 jam · **M** ≈ 1 hari · **L** ≈ 2–3 hari.
> Status mengikuti pekerjaan nyata di branch, bukan rencana.

---

## Epic 1 — Foundation (Phase 1)

| # | Task | Est | Status | Acceptance |
|---|---|---|---|---|
| 1.1 | Setup Vite + React + TS, `tsconfig`, alias `@/` | S | ✅ | `npm run dev`/`build` berhasil |
| 1.2 | Design tokens (`tokens.css`) + base styles + dark/light | M | ✅ | Kontras AA lolos skrip |
| 1.3 | `AppShell`, `Header`, `Footer`, skip-link | M | ✅ | Keyboard reachable |
| 1.4 | Hash router + `routes.tsx` + 404 | M | ✅ | Back/forward & deep link bekerja |
| 1.5 | Tool registry + katalog beranda + filter kategori | M | ✅ | Registry satu-satunya sumber daftar tool |
| 1.6 | `ToolSearch` + `Ctrl/Cmd+K` | S | ✅ | Skoring IA §7 |
| 1.7 | `ThemeToggle` + preferensi tersimpan | S | ✅ | Tidak ada kunci berisi input |
| 1.8 | Komponen bersama: Button, Panel, CodeArea, StatusMessage, Copy/Reset/Download, EmptyState, Kbd | L | ✅ | Reusable, tanpa styling hard-coded |
| 1.9 | Halaman Community & Privacy | S | ✅ | Tautan GitHub + daftar pref key dari kode |
| 1.10 | ErrorBoundary root + per route (chunk load error) | S | ✅ | Fallback punya tombol reload |

## Epic 2 — Core Utilities (Phase 2)

| # | Task | Est | Status | Acceptance |
|---|---|---|---|---|
| 2.1 | Engine case conversion (`lib/text/case.ts`) + test tabel PRD §6.1 | M | ✅ | Semua kasus uji lulus |
| 2.2 | Halaman Case Converter (9 output + copy per baris) | M | ✅ | Copy per gaya; preferensi gaya terakhir |
| 2.3 | Engine JSON format + error berposisi (`lib/json/*`) + test | M | ✅ | Error memuat baris & kolom + cuplikan |
| 2.4 | Halaman JSON Formatter (format/minify/validasi, indent) | M | ✅ | Catatan presisi & duplicate key tampil |
| 2.5 | Engine XML format/minify + serializer sendiri + test per node type | L | ✅ | Komentar/PI dipertahankan; mixed content aman |
| 2.6 | Halaman XML Formatter (+ opsi preserve comments) | M | ✅ | Error well-formed jelas |
| 2.7 | Engine text diff (baris + karakter, opsi ignore) | M | ✅ | Ringkasan +/-/~ akurat |
| 2.8 | Halaman Text Diff (`DiffView`, swap, copy/download unified) | L | ✅ | Aksesibel, scroll sinkron |
| 2.9 | Engine JSON diff struktural + path + patch | L | ✅ | Key order diabaikan, array bermakna |
| 2.10 | Halaman JSON Diff (tampilan path & patch) | M | ✅ | Patch berlabel deskriptif |
| 2.11 | Penegakan batas 1 MB + state over-limit di semua tool | S | ✅ | Peringatan + pemrosesan berhenti |

## Epic 3 — Quality gate

| # | Task | Est | Status | Acceptance |
|---|---|---|---|---|
| 3.1 | ESLint 10 + typescript-eslint, `npm run lint` bersih | S | ✅ | 0 error |
| 3.2 | `tsc --noEmit` bersih (typecheck) | S | ✅ | 0 error |
| 3.3 | Vitest + jsdom + RTL; unit test engine | L | ✅ | Semua test hijau |
| 3.4 | Audit privasi otomatis (storage & network) | S | ✅ | Gagal bila ada kebocoran |
| 3.5 | Skrip batas modul (`check-boundaries`) | S | ✅ | Gagal bila engine impor React |
| 3.6 | Skrip budget bundle (`check-bundle`) | S | ✅ | JS awal < 200 KB gzip |
| 3.7 | Skrip kontras (`check-contrast`) untuk kedua tema | S | ✅ | Semua pasangan AA |
| 3.8 | Smoke test build di base path `/developer-utility-hub/` | S | ✅ | index + asset 200 |

## Epic 4 — Release

| # | Task | Est | Status | Acceptance |
|---|---|---|---|---|
| 4.1 | `README.md` (tujuan, cara jalan, kontribusi, privasi) | S | ✅ | Instruksi dapat diikuti dari nol |
| 4.2 | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md` | S | ✅ | Mengacu ke ADR & PRD |
| 4.3 | Issue & PR templates (feature request, bug report) | XS | ✅ | Sesuai blueprint §8 |
| 4.4 | CI workflow (lint/typecheck/test/build/checks) | M | ✅ | Hijau pada PR |
| 4.5 | Deploy workflow GitHub Pages + `.nojekyll` + `404.html` | M | ✅ | Job deploy hanya dari `main` |
| 4.6 | Lisensi MIT tercatat di README & footer | XS | ✅ | Sesuai ADR/blueprint v2 |

## Epic 5 — Expansion (Phase 5) — SELESAI

Keputusan cakupan: ADR-0007. Semua item di bawah punya engine murni + test +
halaman, tanpa dependency baru.

| # | Tool | Engine | Est | Status |
|---|---|---|---|---|
| 5.1 | Base64 Encode/Decode (+ URL-safe, wrap 76) | `lib/encoding/base64.ts` | M | ✅ |
| 5.2 | URL Encode/Decode (+ mode form, `+`→spasi) | `lib/encoding/url.ts` | S | ✅ |
| 5.3 | HTML Entity Encode/Decode (named + numerik, tanpa DOM) | `lib/encoding/html-entity.ts` | M | ✅ |
| 5.4 | String Escape/Unescape (JSON/JS/HTML/SQL/XML) | `lib/encoding/escape.ts` | M | ✅ |
| 5.5 | UUID Generator v4 & v7 (Web Crypto, time-ordered) | `lib/dev/uuid.ts` | M | ✅ |
| 5.6 | Hash Generator SHA-256/512/1 (hex + base64) | `lib/dev/hash.ts` | M | ✅ |
| 5.7 | Unix Timestamp Converter (UTC + lokal, relatif) | `lib/dev/timestamp.ts` | M | ✅ |
| 5.8 | Color Converter HEX/RGB/HSL + pratinjau | `lib/dev/color.ts` | M | ✅ |
| 5.9 | Number Base Converter (BigInt) | `lib/dev/number-base.ts` | S | ✅ |

Gate tambahan yang dijalankan: registry-load test (semua 14 `load()` dirender),
axe a11y untuk semua halaman, dan audit privasi diperluas ke tool Phase 5.

## Backlog ekspansi berikutnya (Phase 6+) — belum dijadwalkan

| Item | Catatan |
|---|---|
| Regex tester | **Ditunda** — ADR-0008: butuh Web Worker + terminasi, bukan `setTimeout` |
| SQL formatter | **Ditunda** — hanya realistis dengan parser/dialek; dependency besar |
| JWT decoder | **Ditunda** — butuh desain microcopy agar tidak disalahartikan sebagai verifikasi |
| XML Diff | **Ditunda** — tentukan tekstual vs struktural lebih dulu (semangat ADR-0004) |
| Base64 → file / file → Base64 | Butuh kebijakan ukuran file dan File API; belum ada permintaan |
| Cron expression parser | Kandidat berikutnya setelah ada permintaan nyata |
| Cron/JWT/Hash file-level, diff antar file | Tunggu kebutuhan |
| JSON→XML / XML→JSON | ADR-0004: butuh aturan pemetaan dulu |
| XML Diff | Tentukan tekstual vs struktural sebelum mulai |
| File comparison, favorites, recent, command palette | Sesuai blueprint §5/§11 — tunggu kebutuhan nyata |
| Web Worker untuk engine | Dipicu data, lihat ADR-0005 §3 |

## Definition of Done (per task)

- [ ] Kode + test ada; `lint`, `typecheck`, `test`, `build` hijau.
- [ ] Perilaku sesuai PRD; keputusan baru dicatat sebagai ADR, bukan komentar kode.
- [ ] Tidak ada dependency baru tanpa alasan yang ditulis di PR.
- [ ] Aksesibel: keyboard + label + status announcements.
- [ ] Tidak ada isi input di storage/URL/network.
