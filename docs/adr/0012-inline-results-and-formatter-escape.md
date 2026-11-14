# ADR-0012 — Hasil menempel di panel input, dan formatter mendukung escape

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Konteks:** putaran umpan balik keempat

## Masalah

1. **Hasil terlalu jauh dari input.** Pada Text Diff, JSON Diff, dan kedua
   formatter, pengguna mengetik di panel atas lalu harus menggulir ke bawah untuk
   melihat hasilnya. Pada layar 1280×800, bagian "Hasil" sering berada di bawah
   lipatan. Interaksi yang seharusnya langsung terasa justru menuntut scroll
   bolak-balik.
2. **Formatter tidak bisa escape.** JSON/XML Formatter hanya format, minify, dan
   validasi. Untuk mengubah teks biasa menjadi string JSON atau entitas XML,
   pengguna harus pindah ke tool Utilities → String Escape. Padahal justru di
   formatter itulah teks sedang dipegang.

## Keputusan

### 1. Strip hasil di dalam panel input

Komponen baru `InlineResult` menempel di bawah textarea **di dalam panel yang
sama**, dipisahkan garis atas. Isinya bergantung tool:

| Tool | Strip berisi |
|---|---|
| Text Diff | legenda + diff bergaya git (baris, nomor, penanda) |
| JSON Diff | tabel perubahan per JSON Pointer atau teks patch |
| JSON/XML Formatter | output teks atau ringkasan validasi |

Alasan memilih **panel kanan** untuk diff (bukan kiri): panel kanan adalah teks
yang baru saja diubah, jadi diff berada tepat di sisi keputusan pengguna. Panel
kiri tetap murni input agar tetap bisa dibaca berdampingan.

Hal-hal yang dijaga:

- `InlineResult` adalah `<section aria-label>` sehingga tetap bisa ditemukan
  pembaca layar dan test (`getByRole("region", { name: /Hasil/ })`).
- Strip tidak menambah tinggi tanpa batas: `max-height: 46vh` dan bisa digulir.
- Header strip bisa memuat `meta` (mis. `+2 −0 ~0`) dan `actions` (tombol salin)
  sehingga tombol salin tetap dekat dengan hasilnya, bukan di toolbar jauh di atas.
- Panel input memakai `stacked` (`panel--with-result`) agar isi panel tersusun
  vertikal: textarea mengisi sisa ruang, strip menempel di bawahnya.
- Section "Hasil" terpisah **dihapus** dari halaman-halaman ini. Tidak ada dua
  tempat yang menampilkan hal yang sama.

### 2. Escape sebagai mode formatter, bukan tool lain

JSON Formatter mendapat tombol **Escape** dan **Unescape**; XML Formatter juga.
Saat mode escape aktif, opsi yang tidak relevan (indentasi, pertahankan komentar)
disembunyikan dan diganti pemilih bentuk escape. Ini menghindari toolbar yang
menampilkan kontrol mati.

Target escape dipisah dari `EscapeTarget` yang sudah ada, karena maknanya beda:

| Target baru | Hasil |
|---|---|
| `json-string` | isi string JSON **tanpa** kutip — untuk disisipkan ke dokumen |
| `json-document` | nilai string JSON berkutip — sah sebagai dokumen utuh |
| `xml-text` | lima entitas XML untuk isi elemen/atribut |
| `xml-document` | teks dibungkus `<escaped>…</escaped>` |

`EscapeTarget` lama (`json`, `js`, `html`, `sql`, `xml`) **tidak diubah** agar
tool String Escape dan test-nya tetap berlaku.

### 3. Unescape tanpa `JSON.parse`

Percobaan pertama memakai `JSON.parse` untuk membalik escape, dan gagal pada
kasus nyata: teks yang ditempel mengandung **baris baru asli**, dan `JSON.parse`
menolaknya sebagai *control character*. Solusinya `unescapeJsonEscapes()`:

- menafsirkan escape satu per satu (`\n`, `\t`, `\"`, `\\`, `\/`, `\b`, `\f`, `\r`);
- memvalidasi `\uXXXX` (4 digit hex) dan melaporkan error bila tidak sah;
- membiarkan escape tak dikenal apa adanya, bukan menebak;
- melaporkan backslash di akhir input sebagai error.

Konsekuensi yang diterima: input yang *memang* berisi JSON berkutip ganda di
dalamnya tidak bisa dibedakan dari teks biasa. Untuk kebutuhan itu, tool String
Escape tetap jadi tempat yang tepat.

## Konsekuensi

**Positif**

- Input dan hasil selalu satu blok pandang; tidak ada scroll bolak-balik.
- Aksi (salin) dan ringkasan (+/−/~) berada di dekat hasil, bukan di toolbar.
- Escape tersedia di tempat teks sedang dipegang; tidak perlu pindah tool.

**Negatif / dikendalikan**

- Halaman tool formatter kini satu panel penuh, bukan dua kolom. Untuk diff dua
  kolom tetap dipertahankan karena membandingkan dua teks memang butuh dua input.
- Strip hasil menambah kompleksitas panel; diuji lewat `inline-result.test.tsx`
  yang memeriksa hasil berada di dalam `.panel` yang sama dengan textarea.
- `unescapeJsonEscapes` lebih permisif daripada `JSON.parse`. Batasnya ditulis di
  `limitations` tool, bukan disembunyikan.

## Alternatif yang ditolak

- **Membuat tool baru "JSON Escape"** — menambah satu entri registry dan satu
  chunk untuk hal yang secara alami bagian dari formatter. Ditolak.
- **Panel hasil mengapung (sticky)** — menutupi isi dan mengganggu saat mengetik
  paragraf panjang. Ditolak.
- **Tetap memakai dua kolom input+hasil untuk formatter** — pada formulir satu
  input, kolom hasil yang kosong separuh layar justru memboroskan ruang. Ditolak.
