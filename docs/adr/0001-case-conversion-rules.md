# ADR-0001 — Aturan tokenisasi dan gaya Case Converter

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §3.1 ("perlu ditetapkan perilaku untuk tanda baca, Unicode,
  angka, dan singkatan") dan §14 no. 3.

## Konteks

`Case Converter` adalah tool P0, tetapi blueprint hanya memberi tiga contoh
(`hello world`, `userID`, `HTTPResponse`) tanpa aturan umum. Tanpa aturan, tool tidak
bisa diuji dan setiap kontributor akan mengimplementasikan versi berbeda. Kasus yang
paling sering diperdebatkan: akronim berurutan, angka, Unicode, dan gaya yang
beroperasi pada teks asli.

## Keputusan

### 1. Tokenisasi (untuk gaya terpisah-kata saja)

Pipeline: `input → tokenize → normalize(lowercase) → join(style)`.

Aturan pemisahan, diterapkan berurutan pada karakter input:

1. **Separator & tanda baca** memisahkan token:
   whitespace, `_ - . / \ : ; , | + & @ # ~ ! ? ( ) [ ] { } < > " '`
2. **`lower → UPPER`** memisahkan sebelum huruf kapital: `userID` → `user` + `ID`.
3. **`UPPER+ → Upper+lower`** memisahkan sebelum huruf kapital terakhir dari run
   kapital: `HTTPResponse` → `HTTP` + `Response`.
4. **`digit → letter`** memisahkan: `v2Api` → `v2` + `Api`.
   **`letter → digit` tidak** memisahkan: `sha256sum` → `sha256` + `sum`.
5. Token kosong dibuang.

Batas #4 adalah keputusan yang disengaja: angka hampir selalu berfungsi sebagai
sufiks (`v2`, `sha256`, `utf8`), sehingga memisahkannya menghasilkan output yang
lebih buruk (`utf_8` vs `utf8` → `utf8` dipertahankan).

### 2. Normalisasi

Semua token di-lowercase sebelum digabung, kecuali gaya yang beroperasi pada teks
asli. **Tidak ada normalisasi Unicode** dan **tidak ada penghapusan diakritik**:
`café au lait` → `caféAuLait`. Ini mencegah kehilangan data yang tidak diminta pengguna.

### 3. Akronim tidak dipertahankan

`userID` → `userId`, bukan `userID`. `HTTPResponse` → `httpResponse`.
Mempertahankan akronim membutuhkan kamus tak terbatas dan membuat hasil tidak
deterministik untuk input yang tidak ada di kamus.

### 4. Gaya yang beroperasi pada teks asli

| Gaya | Aturan |
|---|---|
| `UPPERCASE` | Seluruh teks di-uppercase; pemisah dipertahankan apa adanya. |
| `lowercase` | Seluruh teks di-lowercase; pemisah dipertahankan. |
| `Title Case` | Tiap kata (dipisah whitespace) diawali huruf kapital, sisa lowercase. |
| `Sentence case` | Huruf pertama teks dan huruf setelah `.` `!` `?` + spasi di-capitalize, sisa lowercase. |

Empat gaya ini **tidak** melalui tokenisasi, karena tujuannya mempertahankan struktur
kalimat.

### 5. Kasus uji mengikat

Tabel di `docs/PRD.md` §6.1 adalah kontrak. Unit test wajib mencakup minimal:
input kosong, spasi berlebih, `snake_case` sebagai input, tanda baca campur,
`HTTPResponse`, `userID`, `v2Api`, `sha256sum`, dan string non-ASCII.

## Konsekuensi

- Positif: deterministik, dapat diuji, tanpa dependency tambahan.
- Negatif: pengguna yang mengharapkan `userID` → `userID` akan kecewa; mitigasi
  adalah catatan tool yang menautkan aturan ini.
- Perubahan aturan setelah MVP = ADR baru, bukan edit diam-diam.

## Alternatif yang ditolak

- **Memakai library `change-case`**: menambah dependency untuk logic ~60 baris, dan
  aturan angka/akronimnya tidak dapat dikonfigurasi sesuai kebutuhan kita.
- **Mempertahankan akronim via regex + kamus**: rapuh, tidak dapat diuji tuntas.
- **Memisahkan juga pada `letter → digit`**: menghasilkan `utf_8`, `sha_256` yang
  lebih buruk untuk nama file dan identifier.
