# ADR-0011 — Sudut siku, form tanpa teks pengapit, alur vertikal

- **Status:** Diterima (menggantikan bagian radius ADR-0010)
- **Tanggal:** 2026-11-12
- **Konteks:** putaran umpan balik ketiga

## Masalah

ADR-0010 memperbesar radius menjadi 20 px. Umpan balik berikutnya:

1. **"Jangan gunakan rounded."** Sudut membulat ditolak sebagai arah visual.
2. **Form tidak efisien.** Input dikelilingi teks label di atasnya, hint di
   bawahnya, dan footer penghitung karakter di bawah panel — tiga lapis teks
   untuk satu kotak input, sehingga mata harus melewati teks sebelum mengetik.
3. **Teks di samping input mengganggu.** Contoh paling jelas: `ATAU TULIS KODE
   WARNA` di samping pemilih warna, `Cepat:` sebelum deretan swatch, dan
   indikator privasi panjang di samping judul hero.

## Keputusan

### 1. Tidak ada sudut membulat sama sekali

- Semua token `--radius-*` bernilai **0**. Token dipertahankan sebagai variabel
  agar tidak ada angka radius liar di komponen; nilainya diubah di satu tempat.
- Radius yang sebelumnya literal (999 px untuk pil, 2–3 px untuk swatch dan
  `mark`) juga menjadi 0. Efeknya: chip, badge, keyword, quick pick, dan tombol
  menjadi persegi bersudut siku.
- Guard otomatis: `src/test/design-guards.test.ts` gagal bila ada token radius
  bukan `0px` atau ada `border-radius` literal di stylesheet.

Konsekuensi visual yang diterima: `mark` pada diff dan swatch warna kehilangan
lengkung kecil — dapat diterima karena diff tetap terbaca lewat warna gutter,
tepi baris, dan penanda `+`/`−`/`~`.

### 2. Input adalah elemen terpenting di panelnya

- `CodeArea` **tidak merender label terlihat**. Judul panel di atasnya sudah
  menyebut isi ("Teks input", "Hasil"), dan placeholder memberi contoh nyata.
  Label tetap ada sebagai `sr-only` sehingga nama aksesibel tidak hilang.
- `FieldLabel` default menjadi `sr-only`; prop `visible` hanya dipakai bila
  benar-benar tidak ada konteks visual lain.
- `hint` pada `CodeArea` menjadi `sr-only` dan dihubungkan lewat
  `aria-describedby`, jadi pembaca layar tetap mendapat penjelasan.
- Input tunggal (number base, timestamp, color) memakai `.field-body`: satu
  input lebar penuh, tanpa label dan tanpa paragraf bantuan di bawahnya.
- Footer panel tidak lagi memuat teks prosa; hanya sisa karakter yang
  dikanan-kanankan, dan hanya pada panel input yang punya batas panjang.
- `hint-text` yang masih dipakai dibuat `--text-xs` dan warna `--fg-subtle`
  agar tidak bersaing dengan isi form.

### 3. Alur vertikal, bukan dua kolom yang dipaksakan

Input di atas, hasil di bawah (alur baca alami: masukkan → lihat hasil).
Panel input tidak lagi setinggi panel hasil; tinggi minimum panel turun dari
240 px ke 200 px agar satu layar laptop menampilkan input **dan** hasil tanpa
scroll.

### 4. Hilangkan teks yang tidak menambah informasi

| Sebelum | Sesudah |
|---|---|
| Indikator privasi panjang di samping hero | `100% di browser` di footer situs |
| `Cepat:` sebelum swatch warna | swatch langsung, tanpa label |
| `ATAU TULIS KODE WARNA` di samping picker | placeholder yang menyebut tiga format |
| Paragraf 3 baris di bawah hasil UUID/JWT | satu baris ringkas, sisanya sudah ada di "Catatan keterbatasan" |

### 5. Tanpa bayangan dekoratif dan tanpa gerak

Kartu dan panel memakai border 1 px, bukan `box-shadow`. Hover pada kartu
mengubah warna border dan latar, bukan mengangkat kartu (`translateY`) atau
menambah bayangan. Tidak ada `transform: scale` pada swatch.

## Konsekuensi

**Positif**

- Satu bahasa bentuk: siku di semua permukaan. Tidak ada campuran radius yang
  membuat UI terasa tidak konsisten.
- Mata langsung jatuh ke input; tidak ada teks yang harus dilewati dulu.
- Tinggi halaman tool berkurang, sehingga input dan hasil sering terlihat
  bersamaan.

**Negatif / dikendalikan**

- Sudut siku pada tombol kecil bisa terasa kaku; diimbangi dengan padding yang
  cukup dan batas fokus 2 px.
- Menghilangkan label terlihat menaikkan ketergantungan pada judul panel dan
  placeholder. Dikendalikan: label `sr-only` tetap ada, dan setiap input
  diuji lewat `getByLabelText`.
- Guard radius hanya memeriksa token dan stylesheet; komponen yang menulis
  `style={{ borderRadius }}` tidak tertangkap. Tidak ada komponen yang
  melakukannya saat ADR ini ditulis.

## Alternatif yang ditolak

- **Radius kecil 2–4 px ("hampir siku")** — tetap terlihat membulat dan
  mengembalikan pertanyaan "kenapa tidak konsisten?". Ditolak.
- **Label terlihat dalam bentuk placeholder saja** — menghilangkan label saat
  pengguna mulai mengetik; sudah ditangani dengan `sr-only`, bukan placeholder
  yang hilang.
- **Tetap memakai shadow untuk hierarki** — setelah radius dihapus, shadow justru
  membuat panel terlihat melayang tanpa alasan. Border dipilih.
