# ADR-0005 — Batas ukuran input dan strategi pemrosesan

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §14 no. 5 ("Batas ukuran input dan dukungan file") dan
  sebagian risk register §7 ("Input besar membekukan UI").

## Konteks

Blueprint menyebut risiko freeze UI dan "evaluasi Web Worker", tetapi tanpa angka.
Tanpa batas, risk register tidak dapat dieksekusi dan tidak bisa diuji.

## Keputusan

### 1. Batas karakter

| Batas | Nilai | Perilaku saat terlampaui |
|---|---|---|
| Per panel input | 1.000.000 karakter (≈1 MB) | Tool **berhenti memproses**, input tetap ada, tampilkan peringatan + tombol *Reset* |
| Total dua panel (diff) | 1.000.000 karakter gabungan | Sama seperti di atas |
| Kedalaman JSON (diff) | 200 level | Error terstruktur, bukan stack overflow |

Karakter dihitung dengan `String.length` (UTF-16 code unit), bukan byte — cukup
akurat untuk keperluan ini dan O(1).

### 2. Strategi pemrosesan MVP: sinkron + debounce

- Pemrosesan berjalan di main thread, di-debounce 200 ms.
- Tidak ada Web Worker di MVP. Alasannya: batas 1 MB membuat pekerjaan tetap
  di bawah ~100 ms untuk keempat engine (diukur di Chrome desktop dan Android mid-range).
- Indikator "memproses" muncul **hanya** bila pemrosesan melewati 150 ms, sehingga
  tidak ada kedipan UI pada input kecil.

### 3. Jalur eskalasi (dipicu data, bukan spekulasi)

Worker baru ditambahkan bila salah satu terjadi:

- Ada laporan nyata freeze pada input < 1 MB, atau
- Salah satu batas dinaikkan melebihi 2 MB, atau
- Hasil benchmark di CI menunjukkan p95 > 300 ms untuk 1 MB.

Bila eskalasi terjadi: engine (`lib/`) sudah murni fungsi bebas DOM, sehingga bisa
dipindahkan ke Worker tanpa mengubah engine itu sendiri.

### 4. File

**Diperbarui oleh ADR-0017:** berkas lokal kini didukung pada dua tool khusus
(Gambar ⇄ Base64, PDF ⇄ Base64), dengan batas 20 MB per berkas dan tanpa
mengunggah apa pun. Tool berbasis teks tetap hanya menerima paste/type, dan
batas 1.000.000 karakter tidak berubah.

## Konsekuensi

- Positif: dapat diuji, dapat ditampilkan di UI, tanpa kompleksitas Worker.
- Negatif: pengguna dengan file > 1 MB tidak terlayani di MVP; pesan harus jelas
  agar tidak terasa seperti bug.
- Constraint arsitektur: engine di `src/lib/` **tidak boleh** mengakses `window`,
  `document`, atau API browser lain — hanya menerima string/object dan mengembalikan hasil.

## Alternatif yang ditolak

- **Tanpa batas**: freeze tidak terhindarkan dan tidak dapat diuji.
- **Web Worker sejak MVP**: menambah kompleksitas transfer data & test untuk masalah
  yang belum terbukti pada batas 1 MB.
- **Batas berbasis byte**: menghitung byte UTF-8 butuh encoding pass tambahan untuk
  keuntungan yang tidak berarti pada batas ini.
