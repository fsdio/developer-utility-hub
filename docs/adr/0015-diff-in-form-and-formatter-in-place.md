# ADR-0015 — Diff di dalam kedua form, formatter mengubah isi form

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Menggantikan sebagian:** ADR-0012 (strip hasil inline untuk diff & formatter)

## Masalah

Setelah ADR-0012, diff masih punya **panel hasil sendiri** berisi tabel diff dan
empty state "Menunggu input". Artinya halaman Text Diff punya tiga blok: form
Original, form Modified, dan hasil perbandingan. Pengguna harus membaca ulang
teks yang sama di dua tempat dan tidak bisa menyunting hasilnya.

Formatter punya masalah serupa: "Hasil Format" adalah blok terpisah. Untuk
merapikan JSON lalu memperbaikinya sedikit, pengguna harus menyalin hasil ke
input — dua langkah untuk satu niat.

## Keputusan

### 1. Diff langsung terlihat di dalam kedua form

Tidak ada panel hasil pada Text Diff (dan tidak ada empty state "Menunggu
input"/"Perbedaan"):

- Panel **Original** menyorot baris yang hilang (merah) dan baris yang berubah
  (kuning, dengan penanda karakter yang dihapus).
- Panel **Modified** menyorot baris baru (hijau) dan baris berubah (kuning,
  dengan penanda karakter yang ditambahkan).
- Ringkasan `+n −n ~n` pindah ke footer panel Modified.
- Tombol `Copy diff` dan `Download` tetap menyalin bentuk unified (teks diff).

JSON Diff mengikuti aturan yang sama meski perbandingannya struktural, bukan per
baris: tabel perubahan per JSON Pointer (atau tampilan patch) berada **di dalam
panel kanan**, di bawah textarea. Tidak ada strip "Menunggu input/Perubahan" dan
tidak ada sorotan per baris — memetakan perubahan path ke nomor baris JSON bisa
menyesatkan setelah format berubah.

Implementasi: `CodeArea` menerima prop `overlay` (larik per baris) dan merender
lapisan `aria-hidden` **di belakang** textarea. Textarea tetap satu-satunya
elemen yang bisa diedit, jadi pengguna menyunting teks aslinya sambil melihat
sorotannya. Metrik teks lapisan disamakan dengan textarea (font, `line-height`,
padding, `tab-size`), dan `scrollTop`/`scrollLeft` disinkronkan pada event
`scroll`, sehingga sorotan tidak pernah bergeser dari teks.

### 2. Formatter (JSON & XML) mengubah isi form

- `Format`, `Minify`, `Escape`, `Unescape` **menggantikan isi textarea** dengan
  hasilnya; tidak ada blok "Hasil Format".
- `Validasi` tidak mengubah teks: ia hanya menampilkan satu baris status
  (tipe root, jumlah key/elememen) atau pesan error berposisi baris/kolom.
- Satu tombol salin menyalin isi form; `Download` mengunduh isi form.
- Aksi bisa dirangkai: `Minify → Format` memakai hasil minify sebagai input.

### 3. Penanda aksesibilitas

- Lapisan sorotan ditandai `aria-hidden` agar teks tidak dibacakan dua kali;
  yang diumumkan ke pembaca layar adalah ringkasan di footer panel Modified
  (`+n −n ~n`, `aria-live="polite"`) — warna bukan satu-satunya penanda.
- Diff tetap bisa disalin sebagai teks unified lewat `Copy diff` dan diunduh
  sebagai `.diff`, sehingga pengguna pembaca layar punya jalur non-visual yang
  setara dengan sorotan visual.

## Konsekuensi

**Positif**

- Satu tempat untuk melihat dan menyunting: tidak ada perpindahan mata antara
  form dan hasil.
- Halaman diff tidak lagi memuat tabel diff duplikat → DOM lebih ringan dan
  tinggi halaman tetap stabil saat mengetik.
- Pola ini konsisten dengan ADR-0014 (satu form, satu aksi) untuk seluruh tool.

**Negatif / dikendalikan**

- Overlay bergantung pada metrik teks yang identik. Bila `font-size`,
  `line-height`, atau padding `.code-area` diubah, `.code-area-layer` **wajib**
  diubah bersamaan; keduanya ditulis berurutan di `src/styles/base.css`.
- Tabrakan huruf lebar (emoji, karakter CJK) bisa membuat lapisan sorotan
  sedikit meleset di tengah baris, tetapi warna per baris tetap tepat karena
  setiap baris adalah blok tersendiri.
- Teks asli hilang setelah Format/Format-ulang. Diterima: `Reset` tetap ada dan
  undo textarea browser masih bekerja (alasannya sama dengan ADR-0014).
- Diff karakter hanya untuk baris `modified` dengan jumlah baris seimbang;
  blok yang jumlahnya berbeda tetap tampil sebagai baris tambah/hapus — ini
  perilaku engine diff, bukan efek samping overlay.

## Alternatif yang ditolak

- **Contenteditable dengan span berwarna** — merusak perilaku caret, undo, dan
  aksesibilitas textarea. Ditolak.
- **Editor kode pihak ketiga (CodeMirror/Monaco)** — menambah ratusan KB untuk
  kebutuhan menyorot beberapa baris. Ditolak.
- **Tetap memakai panel hasil namun dihapus empty state-nya** — menghemat satu
  blok, tetapi tetap memaksa pengguna membaca teks yang sama dua kali. Ditolak.
