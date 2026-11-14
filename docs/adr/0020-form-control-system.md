# ADR-0020 — Satu sistem kontrol form untuk seluruh situs

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** laporan "masih ada kontrol form yang tampil native, belum ada gayanya"
- **Terkait:** ADR-0011 (label `sr-only`, form tanpa teks pengapit), ADR-0014
  (satu form satu aksi), ADR-0019 (katalog daftar)

## Konteks

Stylesheet hanya memberi gaya pada `input[type="text"]` dan `input[type="search"]`.
Kontrol lain yang benar-benar dipakai aplikasi tidak tersentuh:

| Kontrol | Tempat | Yang terjadi |
|---|---|---|
| `input[type="password"]` | Basic Auth | Kotak putih bawaan, tinggi beda dengan input di sebelahnya |
| `textarea` | JWT Verifier (kunci PEM) | Font proporsional bawaan, tanpa fokus ring, sudut membulat sistem |
| `select` di panel | API Key (algoritma sidik jari) | Panah dan warna bawaan OS, tidak mengikuti tema gelap |
| `select` di toolbar | UUID, Hash, Base64, Diff, Number Base, API Key | Tinggi tidak sama dengan tombol di sebelahnya |
| `input[type="file"]` | FileDropZone | Tombol "Choose File" bawaan browser |
| Placeholder | Semua | Warna bawaan browser, kontras tidak dijamin di tema gelap |

Penyebab strukturalnya: setiap halaman merangkai kontrolnya sendiri, sehingga
halaman yang ditulis belakangan melewatkan kelas gaya. Gaya hanya hidup di
selector tipe, bukan di komponen.

## Keputusan

### 1. Normalisasi semua kontrol di tingkat stylesheet

Satu aturan dasar berlaku untuk `select`, `textarea`, dan setiap `input` kecuali
`checkbox`/`radio`/`range`/`file`/`color` — yaitu jenis yang bukan kotak teks.
Atribut yang disamakan: `font: inherit`, ukuran teks, warna, latar `--bg-raised`,
border `--border-strong`, sudut 0 (`--radius-md`), padding, dan `min-height: 34px`
sehingga kontrol di toolbar setinggi tombolnya.

Tambahan yang ditutup di level ini:

- `:hover`, `:focus-visible` (cincin `--focus-ring`), dan `:disabled` (redup +
  `not-allowed`) untuk semua kontrol;
- `::placeholder` memakai `--fg-subtle`, bukan warna bawaan browser;
- `textarea` mendapat `min-height` dan `resize: vertical`;
- `select` memakai `appearance: none` + chevron dua gradien linear yang
  mengambil warna `--fg-subtle`, karena panah bawaan tidak bisa diwarnai;
- `input[type="file"]::file-selector-button` diberi gaya tombol yang sama.

### 2. Komponen kontrol, bukan markup ad-hoc

`src/components/common/Field.tsx` sekarang mengekspor:

| Komponen | Dipakai untuk |
|---|---|
| `TextField` | Input satu baris + label (`sr-only` secara default) + hint `aria-describedby` + `aria-invalid` |
| `TextAreaField` | Textarea multi-baris (kunci PEM) dengan gaya kontrol yang sama |
| `SelectField` | `select` yang selalu dibungkus `.select-wrap` |
| `FieldLabel`, `CheckboxField` | Seperti sebelumnya |

`TextField`/`TextAreaField` merender `.control` → `.control-input`
(`--mono`, `--area`) sehingga label tersembunyi, hint, dan keadaan error selalu
konsisten dan tidak bergantung pada halaman yang menulisnya.

Enam halaman yang sebelumnya memakai markup mentah dipindahkan ke komponen ini:
Number Base, Timestamp, JWT Verifier (kunci + issuer + audience), Basic Auth
(username + password), dan API Key (awalan + algoritma sidik jari).

### 3. Pengecualian yang disengaja

Kontrol berikut tetap ditulis langsung karena butuh struktur khusus, dan
semuanya sudah punya gaya sendiri: `CodeArea` (`.code-area`, area teks utama),
kotak cari katalog (`.catalog-search`), combobox pencarian global (butuh
`role="combobox"` dan `aria-activedescendant`), input `type="file"` tersembunyi
di `FileDropZone`, dan pemilih `type="color"` (kotak swatch di halaman Color).
Daftar ini dikunci di uji, jadi berkas baru yang memakai kontrol mentah akan
gagal lebih dulu sebelum sampai ke pengguna.

## Konsekuensi

- Tinggi kontrol seragam 34 px; `select` di toolbar sejajar dengan tombol.
- Tema gelap kini juga berlaku pada `select`, `textarea`, opsi dropdown, dan
  placeholder — sebelumnya beberapa di antaranya tetap terang.
- `src/test/form-controls.test.tsx` menjaga dua hal: tidak ada kontrol mentah
  baru di luar daftar pengecualian, dan stylesheet tetap menormalkan semua jenis
  kontrol yang dipakai.
- Tidak ada dependency baru dan tidak ada perubahan API engine.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| Menambah aturan CSS per halaman | Masalah akan kembali setiap kali tool baru ditulis; akar masalahnya markup ad-hoc |
| Library komponen (Radix/Ark) | Menambah dependency dan bobot hanya untuk kontrol dasar; ADR-0006 mengunci stack minimal |
| Memakai `select` native besar-besaran tanpa `appearance: none` | Panah bawaan OS tidak mengikuti tema dan tidak konsisten antarbrowser |
| Menampilkan label terlihat di setiap kontrol | Bertentangan dengan ADR-0011 dan menambah kebisingan visual |
