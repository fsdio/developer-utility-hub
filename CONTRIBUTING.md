# Contributing

Terima kasih. Proyek ini sengaja kecil dan disiplin: **lima tool yang matang lebih
bernilai daripada puluhan yang setengah berfungsi.**

## Sebelum menulis kode

1. Baca `docs/PRD.md` (scope + acceptance criteria) dan `docs/adr/`.
2. Perubahan perilaku tool harus terlebih dahulu ada di PRD atau ADR.
   Jika belum ada, buka issue dulu — jangan mengubah perilaku diam-diam di PR.
3. Dependency baru butuh alasan tertulis di deskripsi PR, termasuk mengapa kode
   internal tidak cukup.

## Alur kerja

```bash
npm ci
npm run verify     # wajib hijau sebelum PR
```

`verify` menjalankan: lint → typecheck → test → build → batas modul → budget bundle
→ kontras warna → smoke test base path GitHub Pages. PR dengan CI merah tidak direview.

## Aturan teknis yang tidak bisa dinegosiasi

| Aturan | Alasan |
|---|---|
| Engine (`src/lib/{text,json,xml,diff}`) tetap murni | Harus bisa dipindah ke Web Worker; ditegakkan `check:boundaries` |
| Tidak ada `dangerouslySetInnerHTML` | XSS; ditegakkan ESLint |
| Tidak ada isi input di storage/URL/network | Privasi; ditegakkan `privacy.test.tsx` |
| Setiap tool punya label `Catatan keterbatasan` | Pengguna harus tahu batas tool |
| Semua kontrol dapat diakses keyboard | `a11y.test.tsx` (axe) harus bersih |
| Teks UI berbahasa Indonesia, istilah teknis tetap Inggris | Konsistensi produk |

## Menambah tool baru

1. Tambah entri di `src/registry/tools.ts` (id, kategori, keywords, limitations, `load`).
2. Buat `src/features/<kategori>/<id>/<Nama>Page.tsx` sebagai default export.
3. Taruh logika di `src/lib/`, bukan di komponen.
4. Tambah unit test engine + component test halaman.
5. Pastikan `toolsByCategory()` menempatkannya, dan budget bundle tetap terpenuhi.

Registry adalah satu-satunya daftar tool. Jangan menulis daftar tool di tempat lain.

## Gaya kode

- TypeScript strict; tidak ada `any` barus.
- Komentar menjelaskan **mengapa**, bukan mengulang kode.
- Preferensi bahasa: nama API/istilah teknis Inggris, kalimat penjelas Indonesia.
- Jangan menambah emoji atau animasi hias.

## Commit & PR

- Commit kecil dan fokus; pesan menjelaskan perubahan perilaku.
- PR menyertakan: apa yang berubah, mengapa, dan bukti (test/verifikasi).
- Untuk perubahan visual, sertakan screenshot light & dark.

## Melaporkan bug / mengusulkan fitur

Gunakan GitHub Issues dengan template yang tersedia (`feature_request`, `bug_report`).
Jangan lampirkan data sensitif — cukup contoh minimal.
