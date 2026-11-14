# ADR-0019 — Katalog berbentuk daftar dan pengelompokan menurut tugas

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** umpan balik "jangan terpaku pada kartu, pakai list yang lebih
  compact, dan perbaiki grouping agar sesuai visi one action / minim action"
- **Terkait:** ADR-0010 (kartu sebagai elemen katalog — **digantikan di sini**),
  ADR-0011 (sudut siku), ADR-0014 (satu form satu aksi)

## Konteks

Katalog beranda memakai `card-grid` berisi `ToolCard`: tiap tool dirender
sebagai kartu setinggi 132 px dengan kicker, judul, dua baris deskripsi, dua chip
kata kunci, dan panah yang muncul saat hover. Dengan 17 tool, beranda butuh
±1.300 px vertikal hanya untuk katalog, dan mata harus bergerak dua dimensi.

Dua masalah lain muncul bersamaan:

1. **Grouping tidak sesuai tugas.** Semua tool non-teks/non-diff masuk
   `utilities` (12 tool): Base64, gambar, URL, entitas HTML, UUID, hash,
   timestamp, warna, basis angka, JWT. Satu grup itu mencampur "meng-encode",
   "membuat kredensial", dan "mengubah satuan" — sehingga filter kategori tidak
   mempersempit apa pun secara berarti.
2. **Biaya kognitif.** Visi produk menuntut pengguna sampai ke tool yang benar
   dengan satu aksi. Kartu menambah dekorasi (kicker, chip, hover arrow) tanpa
   menambah informasi yang membantu memilih.

## Keputusan

### 1. Katalog berupa daftar baris (`ToolRow`), bukan grid kartu

Satu baris = satu tool, memakai grid empat kolom:

```
┌────────────────────┬───────────────────────────────┬──────────────┬───┐
│ JSON Formatter     │ Format, minify, validasi…     │ json format  │ → │
└────────────────────┴───────────────────────────────┴──────────────┴───┘
```

- Tinggi baris tetap dan tipis (padding `space-2`), dipisah garis 1 px — bukan
  kotak per tool. Seluruh baris tetap berupa link, jadi target klik besar.
- Deskripsi satu baris dengan `ellipsis`; di layar < 760 px ia membungkus dan
  baris menjadi dua kolom.
- Kata kunci dipangkas jadi dua chip kecil; badge kategori hanya muncul di hasil
  pencarian (di sana konteks grup tidak ada).
- Panah `→` muncul saat hover/fokus, dan di layar sempit selalu tampak (tidak
  ada hover di perangkat sentuh).

### 2. Enam kategori menurut tugas, bukan menurut jenis berkas

| Kategori | Label | Isi |
|---|---|---|
| `text` | Teks | Case Converter |
| `formatter` | Formatter | JSON, XML |
| `diff` | Diff | Text Diff, JSON Diff |
| `encoding` | Encode & Decode | Base64, Gambar ⇄ Base64, PDF ⇄ Base64, URL, HTML Entity, Escape |
| `auth` | Auth & Token | Hash SHA, JWT Decoder, JWT Verifier, Basic Auth, API Key Generator |
| `convert` | Konversi | UUID, Timestamp, Color, Number Base |

Nama kategori menjadi satu kalimat tugas yang bisa dibaca pengguna
(`CATEGORY_HINTS`), mis. "Beralih antara teks, URL, entitas HTML, dan
Base64/berkas". Navigasi header membaca `CATEGORY_ORDER`, jadi tidak ada lagi
daftar kategori hardcode kedua.

### 3. Grup bisa dilipat, aksi membuka tool tetap satu klik

Setiap judul grup punya tombol `Lipat`/`Buka` (`aria-expanded` +
`aria-controls`) dengan hitungan tool di sebelah judul. Melipat memendekkan
halaman ketika pengguna sudah tahu tool yang dicari; membuka tetap satu klik.
Pintasan "Paling sering dipakai" dan "Terakhir kamu buka" tetap di atas katalog
sebagai jalur tercepat.

## Konsekuensi

- `ToolCard.tsx` diganti `ToolRow.tsx`; `card-grid` tidak lagi dipakai katalog
  (masih dipakai halaman 404 untuk daftar tool terkait).
- Beranda turun dari ±1.300 px menjadi ±430 px untuk 20 baris: satu tool terlihat
  per 28 px, dan seluruh katalog terbaca tanpa menggulir jauh.
- Uji katalog diperbarui: ada asersi eksplisit bahwa `.card-grid` tidak dipakai
  dan baris `.tool-row` mencakup seluruh tool, plus uji lipat grup.
- Pencarian tetap menampilkan hasil sebagai daftar baris yang sama, dengan badge
  kategori — satu bentuk baris untuk seluruh situs.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| Kartu lebih kecil / 4 kolom | Masih memaksa gerak mata dua dimensi dan tinggi tidak seragam |
| Tabel dengan header kolom tetap | Menambah baris header dan aturan lebar kolom yang rapuh di layar sempit; daftar grid lebih sederhana |
| Menghapus filter kategori, hanya mengandalkan pencarian | Filter masih jalur tercepat untuk pengguna yang tahu tujuan besarnya |
| Grup selalu terlipat kecuali yang difilter | Menyembunyikan katalog untuk pengunjung baru; melipat harus jadi pilihan pengguna |
| Satu grup `utilities` dipertahankan | Melawan prinsip "satu grup menjawab satu tugas"; filter jadi tidak bermakna |
