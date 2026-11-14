# ADR-0014 — Satu form, satu aksi: hasil menggantikan isi form

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Konteks:** permintaan "prepare one to action" + "tombol copy satu, jangan
  setiap pilihan" + "hasil perbandingan dihapus"

## Masalah

Tiga keluhan yang sumbernya satu: **terlalu banyak tempat dan terlalu banyak
tombol untuk satu pekerjaan**.

1. Converter punya panel input dan panel hasil terpisah, jadi satu aksi menuntut
   mata berpindah dan tombol salin muncul per baris hasil.
2. Case Converter menampilkan sembilan hasil sekaligus, masing-masing dengan
   tombol salin — tiga puluh enam interaksi untuk satu halaman.
3. Diff masih punya section "Hasil perbandingan" di bawah form walau diff-nya
   sudah bisa terlihat dari kedua form.

## Keputusan

### 1. Satu form per tool, hasil menggantikan input

Untuk semua converter satu-input (Case Converter, Base64, URL Encode, HTML
Entity, String Escape): tombol aksi mengubah **isi form itu sendiri**.

- Tidak ada panel hasil kedua.
- Hanya **satu** tombol salin, menyalin isi form.
- Aksi bisa dirangkai: `Encode` lalu `Decode` mengembalikan teks asli tanpa
  memindahkan apa pun secara manual.

### 2. Case Converter: gaya sebagai tombol, bukan daftar hasil

- Sembilan tombol gaya berada **di toolbar di atas form**.
- Menekan tombol mengubah seluruh isi form ke gaya tersebut.
- Gaya bisa dirangkai (`camelCase` → `kebab-case`) karena hasilnya sudah menjadi
  input berikutnya.
- Satu tombol salin untuk seluruh halaman.
- Tombol contoh menjadi tautan di dalam kalimat, bukan tombol tersendiri.

### 3. Diff: hasil di dalam form, section hasil dihapus

- Diff teks tampil **di dalam panel Modified** (ADR-0012), dan section "Hasil
  perbandingan" di bawah form dihapus.
- JSON Diff mengikuti pola sama di panel kanan.
- Ringkasan `+n −n ~n` dipindah ke header strip hasil, bukan paragraf terpisah.

### 4. Aturan copy: satu tombol per halaman

`CopyButton` hanya muncul sekali per halaman:

| Tool | Yang disalin |
|---|---|
| Case Converter | isi form |
| Base64 / URL / HTML Entity / Escape | isi form |
| Hash | digest hex |
| JWT | payload |
| Number Base / Timestamp / Color | semua nilai, satu baris per label |
| Text Diff / JSON Diff | hasil diff/patch |

Tombol salin per baris (UUID, warna) dan per bagian (JWT header/payload)
**dihapus**. Nama aksesibelnya menyebut konteks ("Salin semua basis ke
clipboard") supaya tetap jelas apa yang tersalin.

## Konsekuensi

**Positif**

- Satu tempat untuk melihat dan menyalin hasil pada setiap tool.
- Jumlah interaksi untuk satu pekerjaan turun drastis (kasus terburuk 36 → 3).
- Toolbar menjadi satu-satunya tempat kontrol, form tetap bersih.

**Negatif / dikendalikan**

- Karena hasil menggantikan input, teks asli hilang setelah konversi. Diterima
  karena tombol Reset tetap ada dan riwayat undo textarea browser masih bekerja;
  menambah tombol "kembalikan" akan menambah satu kontrol lagi — bertentangan
  dengan tujuan ADR ini.
- Beberapa tool (number base, timestamp, color) tetap butuh tabel nilai karena
  konversinya memang banyak arah. Tool tersebut tetap satu panel dengan satu
  tombol salin, bukan dua panel.

## Alternatif yang ditolak

- **Panel hasil yang bisa ditutup** — menambah state dan kontrol, tidak
  menyelesaikan masalah "dua tempat".
- **Tombol salin per baris dengan ikon** — tetap 6–9 tombol per halaman; yang
  diminta adalah satu.
- **Membiarkan Case Converter menampilkan sembilan hasil** — berguna untuk
  melihat sekaligus, tetapi bertentangan langsung dengan "hasil masuk ke form".
  Bila nanti dibutuhkan, bisa ditambahkan sebagai tampilan opsional, bukan default.
