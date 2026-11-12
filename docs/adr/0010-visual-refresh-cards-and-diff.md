# ADR-0010 — Refresh visual: kartu, panel, diff bergaya git, dan warna dinamis

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Konteks:** umpan balik pengguna setelah rilis 15 tool

## Masalah

Umpan balik pemakaian nyata menemukan empat hal:

1. **Kartu terlalu kaku.** Sudut `--radius-lg` 10 px pada kartu dan panel membuat
   permukaan terasa seperti tabel, bukan kartu.
2. **Semua permukaan terlihat sama.** Panel kerja, kartu katalog, kotak hasil, dan
   kotak batasan memakai border + radius yang nyaris identik, sehingga tidak ada
   hierarki — mata harus membaca untuk membedakan, bukan mengenali bentuk.
3. **Diff sulit dipindai.** Hanya latar baris yang berwarna, tanpa nomor baris
   ganda, tanpa penanda `+`/`−`, dan penanda `~` tidak terlihat. Ini bukan bentuk
   yang familiar bagi developer yang biasa membaca `git diff`.
4. **Color Converter berbasis form teks.** Untuk tool yang intinya warna, pengguna
   tetap harus mengetik `#rrggbb`; tidak ada cara memilih warna secara langsung,
   dan hasilnya tidak bisa diubah dari baris hasil.

## Keputusan

### 1. Skala radius eksplisit, dua kelas permukaan

`--radius-xs` 6 px, `--sm` 8 px, `--md` 12 px, `--lg` 16 px, `--xl` 20 px,
`--pill` 999 px. Aturannya:

- **Kartu katalog dan panel kerja:** `--radius-xl` (20 px) — kesan "kartu".
- **Permukaan di dalam panel** (baris hasil, stat card, uuid row): `--radius-sm`/`--md`.
- **Elemen pil** (chip, badge, keyword, quick pick): `--radius-pill`.

Kartu dan panel memakai radius yang sama **dengan sengaja**: keduanya adalah
"kontainer", dan konsistensi ukuran sudut membuat halaman terasa satu sistem.
Yang membedakan keduanya adalah **fungsi visual**, bukan radius.

### 2. Empat tingkat permukaan yang bisa dibedakan tanpa membaca

| Tingkat | Contoh | Pembeda |
|---|---|---|
| 0 | latar halaman | `--bg`, tanpa border |
| 1 | kartu katalog | `--bg-raised`, border 1 px, `--shadow-2`, radius 20 px, **kicker aksen** |
| 2 | panel kerja | `--bg-raised`, border 1 px, `--shadow-2`, radius 20 px, **header berlabel** |
| 3 | kotak informasi | `--bg-sunken`, border-kiri 3 px, tanpa shadow (batasan, empty state) |

Kartu katalog mendapat **kicker** (kata kunci pertama, huruf kapital 10 px,
warna aksen) dan **bootstrap layout**: judul, satu kalimat, kaki kartu. Panel
kerja tidak punya kicker tetapi punya header fungsional. Perbedaan ini terbaca
sebelum teks dibaca.

### 3. Diff mengikuti bentuk `git diff`

Setiap baris memakai grid empat kolom: **nomor baris kiri, nomor baris kanan,
penanda, teks**. Penanda: `+` ditambah, `−` dihapus, `~` diubah. Tepi kiri baris
memakai garis 3 px berwarna tegas (`--added-edge`, `--removed-edge`,
`--changed-edge`), gutter bernomor diberi latar lebih pekat, dan sorotan
karakter memakai `mark` dengan garis bawah.

Token baru: `--added-gutter`, `--added-edge`, `--added-mark` dan padanannya untuk
removed/changed, di kedua tema. Semua pasangan teks/latar yang baru masuk ke
`scripts/check-contrast.mjs`, termasuk teks di atas `mark` dan nomor baris.

Warna **bukan satu-satunya penanda**: tombol `+`/`−`/`~` selalu ada, dan setiap
baris membawa teks tersembunyi untuk pembaca layar ("ditambahkan:", dst).

Ringkasan diff menjadi pill berwarna (`+2 ditambah`, `−1 dihapus`, `~1 diubah`)
plus legenda warna di atas diff teks.

### 4. Color Converter memakai warna sebagai input, bukan teks

- Kontrol utama: `<input type="color">` besar 84 px. Nilai tetap disimpan sebagai
  teks di state yang sama, sehingga kedua jalur (pilih dan ketik) tidak pernah
  berbeda hasil.
- Setiap baris hasil (HEX/RGB/HSL) punya tombol salin sendiri dan pemilih warna
  mini, sehingga pengguna bisa memutar warna dari nilai mana pun.
- Preset tampil sebagai **kotak warna** 24 px, bukan tombol berlabel teks.
- Pemilih warna native tidak mendukung alpha, jadi alpha dipertahankan di hasil
  dan ditampilkan sebagai baris sendiri; `hexForColorInput()` memotong ke 6 digit
  khusus untuk kontrol tersebut.

### 5. Navigasi harian: quick picks, pencarian katalog, riwayat

- **Paling sering dipakai:** 6 pintasan tetap (`QUICK_PICKS`) di beranda.
- **Cari di katalog:** input pencarian di beranda memakai `searchTools()` yang
  sama dengan pencarian header — satu sumber kebenaran.
- **Terakhir kamu buka:** `useRecentTools()` menyimpan maksimal 6 **id tool**
  di `duh:v1:recent-tools`.
- **Tool terkait:** setiap halaman tool menampilkan tool lain di kategori yang
  sama, agar pengguna tidak perlu kembali ke beranda.

### 6. Prinsip interaksi

- Setiap target klik terasa bisa diklik: hover mengubah permukaan, `:active`
  memberi umpan balik, `:focus-visible` memakai `--focus-ring` (bukan outline
  global saja).
- Transisi memakai `--motion` (120 ms) dan otomatis menjadi 0 ms saat
  `prefers-reduced-motion: reduce`.
- Tidak ada animasi masuk/keluar halaman, tidak ada kursor kustom, tidak ada
  parallax. "Interaktif" berarti responsif terhadap masukan, bukan ramai.

## Konsekuensi

**Positif**

- Hierarki permukaan terbaca sebelum teks dibaca; mata tidak lelah.
- Diff bisa dipindai seperti file `.diff` biasa di terminal atau review GitHub.
- Tool warna tidak lagi memaksa mengetik kode warna.
- Riwayat tool mempercepat pemakaian harian berulang.

**Negatif / dikendalikan**

- Radius lebih besar berarti lebih sedikit ruang efektif di layar sangat kecil;
  di bawah 640 px baris hasil turun menjadi dua kolom.
- Riwayat tool menambah satu kunci storage. Dibatasi: hanya id tool dari registry,
  tidak ada judul atau isi input. Test privasi memverifikasi hal ini.
- Diff memakai lebih banyak token warna; setiap token baru wajib lolos kontras
  AA di dua tema atau `check:contrast` gagal.

## Alternatif yang ditolak

- **Radius berbeda untuk kartu vs panel** — membuat halaman terasa terdiri dari
  dua sistem. Ditolak setelah dipertimbangkan; diferensiasi dipindah ke kicker,
  header, shadow, dan tipografi.
- **Diff dua kolom berdampingan (side-by-side)** — lebih lebar dari viewport
  laptop pada layar 1280 px dan menyulitkan pembacaan baris panjang. Unified
  seperti git dipilih karena familiar dan hemat ruang.
- **Menyimpan nama tool di riwayat** — tidak perlu; id sudah cukup dan lebih
  kecil risikonya bila daftar tool berubah.
- **Ikon SVG per tool** — menambah 15 aset dan waktu upkeep tanpa memperbaiki
  keterbacaan; kicker kata kunci memberi ritme visual dengan biaya nol.
