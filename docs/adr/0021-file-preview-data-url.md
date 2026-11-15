# ADR-0021 — Pratinjau berkas: data URL lokal, batas ukuran, dan CSP `blob:`

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** laporan "pratinjau hasil konversi PDF/gambar tidak muncul"
- **Terkait:** ADR-0017 (tool berkas Base64), ADR-0013 (offline/CSP), ADR-0005
  (batas ukuran)

## Konteks

Tool **Gambar ⇄ Base64** dan **PDF ⇄ Base64** membuat pratinjau dari
`URL.createObjectURL(blob)` dan memasukkannya ke `<img src>` / `<object data>`.
Di dev server pratinjau terlihat normal, tetapi di build produksi kotaknya
kosong. Ada tiga sebab yang bertumpuk:

1. **CSP memblokir `blob:`.** Meta CSP produksi (`vite.config.ts`) menetapkan
   `img-src 'self' data:` dan `object-src 'none'`. Blob URL bukan `data:`, jadi
   gambar ditolak dan PDF tidak bisa dimuat sama sekali. CSP hanya disuntikkan
   saat `build`, sehingga masalah ini tidak pernah terlihat di `npm run dev`.
2. **Tidak ada state pratinjau.** Bila URL kosong, panel hanya menampilkan teks
   "tempel Base64 di panel kiri" — pengguna tidak tahu apakah berkasnya salah,
   terlalu besar, atau memang jenis yang tidak bisa dirender browser.
3. **Pratinjau berkedip.** `source` dipakai langsung untuk membuat URL; setiap
   ketikan pada Base64 besar membuat blob baru lalu me-revoke yang lama.

## Keputusan

### 1. Pratinjau memakai **data URL**, bukan blob URL

`bytesToDataUrl(bytes, mime)` (engine `src/lib/encoding/base64.ts`) menghasilkan
`data:<mime>;base64,…` langsung dari byte hasil decode. Alasannya:

- data URL sudah diizinkan `img-src 'self' data:` di semua build;
- tidak butuh `object-src` longgar untuk gambar, dan tidak bergantung pada
  dukungan `blob:` per peramban atau mode privasi;
- tetap 100% lokal: tidak ada `fetch`, tidak ada unggahan, tidak ada URL yang
  menunjuk ke server. Data URL tidak pernah masuk `localStorage` atau riwayat.

PDF tetap memakai `<object type="application/pdf" data="data:application/pdf;base64,…">`,
karena penampil PDF bawaan membutuhkan elemen itu. CSP diberi `object-src 'self' blob:`
(sebelumnya `'none'`) dengan tetap **tanpa origin luar**; `blob:` disertakan untuk
peramban/ekstensi yang menolak `data:` pada `<object>`.

### 2. Tiga keadaan pratinjau, semuanya dijelaskan

`previewModeFor(detected, byteLength)` mengembalikan salah satu dari:

| Mode | Kapan | Yang ditampilkan |
|---|---|---|
| `inline` | gambar/PDF ≤ 8 MB | pratinjau + tombol Unduh |
| `too-large` | > `PREVIEW_INLINE_LIMIT` (8 MB) | ukuran + alasan + tombol Unduh |
| `unsupported` | jenis selain gambar/PDF | penjelasan + tombol Unduh |
| `failed` | belum ada Base64 valid | petunjuk awal, bukan kotak kosong |

Footer panel pratinjau selalu menyebut jenis, ukuran, dan kesiapan berkas, jadi
pengguna tidak perlu menebak.

### 3. Debounce 200 ms sebelum parse & pratinjau

`source` ditunda lewat `useDebouncedValue` (PRD §6.0) sebelum read/decode.
Menempel Base64 1 MB tidak lagi memicu puluhan decode dan pratinjau tidak
berkedip.

### 4. CSP diuji, bukan hanya ditulis

`scripts/preview-check.mjs` kini menggagalkan build bila `img-src` tidak memuat
`blob:` atau `object-src` tidak memuat `blob:`. Dengan begitu regresi
"pratinjau kosong di produksi" tidak bisa lolos lagi tanpa ketahuan.

## Konsekuensi

- Pratinjau muncul di dev maupun build produksi, tanpa permintaan jaringan.
- Berkas > 8 MB tidak dipratinjau (unduhan tetap tersedia) agar tab tidak
  kehabisan memori.
- `img-src`/`object-src` sedikit lebih longgar dari sebelumnya, tetapi tetap
  hanya untuk sumber lokal (`'self'`, `data:`, `blob:`) — tidak ada origin luar.
- Uji baru: `src/features/utilities/file-base64/preview.test.tsx` (mode pratinjau,
  data URL, tanpa `createObjectURL`, tanpa `fetch`).

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| Hanya menambah `blob:` ke CSP | Masih bergantung pada dukungan blob per peramban dan tidak memberi tahu pengguna saat pratinjau gagal |
| Menampilkan semua ukuran sebagai pratinjau inline | Base64 20 MB → DOM memuat ~27 MB data URL; tab bisa macet |
| Pratinjau lewat `<iframe src="blob:…">` untuk PDF | Sama seperti di atas, dan `frame-src` harus dilonggarkan |
| Library PDF (pdf.js) | Menambah >300 KB untuk sesuatu yang sudah disediakan penampil browser |
