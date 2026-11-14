# ADR-0017 — Konversi berkas (gambar & PDF) ke Base64 dan sebaliknya

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Memperluas:** ADR-0005 (batas input) dan ADR-0014 (satu form, satu aksi)

## Masalah

Tool Base64 yang ada hanya menerima **teks**. Kasus nyata di lapangan hampir
selalu berupa berkas: menempelkan logo sebagai `data:` URL di CSS, mengirim PDF
lewat API yang hanya menerima JSON, atau memeriksa isi lampiran Base64. Tanpa
tool ini pengguna harus mencari situs lain yang biasanya **mengunggah** berkasnya
ke server — bertentangan langsung dengan janji privasi aplikasi ini.

## Keputusan

### 1. Dua tool terpisah, bukan satu tool dengan mode berkas

| Tool | Route | Menerima | Menolak |
|---|---|---|---|
| **Gambar ⇄ Base64** | `#/tools/image-base64` | PNG, JPEG, GIF, WEBP, SVG, BMP, AVIF | PDF, font, berkas lain |
| **PDF ⇄ Base64** | `#/tools/pdf-base64` | PDF | gambar, font, berkas lain |

Alasan dipisah: cakupan yang sempit membuat hasil pencarian lebih tepat, pesan
penolakan lebih jelas ("ini bukan PDF"), dan pratinjau bisa khusus. Keduanya
memakai satu kerangka (`FileBase64View`) dan satu hook (`useFileBase64`), jadi
tidak ada logika ganda.

### 2. Arah dua arah dengan satu tombol

Toolbar berisi dua tombol arah (pola ADR-0014, `aria-pressed`):

- **Berkas → Base64**: pilih/jatuhkan berkas → Base64 muncul di form (baca-saja).
- **Base64 → Berkas**: tempel Base64 **atau data URL** → pratinjau + tombol
  *Unduh berkas*.

Tidak ada unggahan, tidak ada `fetch`: berkas dibaca lewat `File.arrayBuffer()`
lalu diproses di memori. Ini juga alasan tool ini tidak melanggar CSP
`connect-src 'self'` (ADR-0016) — memang tidak ada permintaan jaringan.

### 3. Jenis berkas dari magic bytes, bukan nama berkas

`detectFile()` memeriksa tanda tangan biner (PNG `89 50 4E 47`, PDF `%PDF`,
RIFF+WEBP, `ftyp`+AVIF, WOFF2, TTF/OTF) dan awal teks untuk SVG. Nama berkas
diabaikan karena bisa menipu dan tidak ada saat pengguna menempel Base64.
MIME dari data URL hanya dipakai bila ada; bila bertentangan, tanda tangan biner
tetap yang menentukan isi.

### 4. Batas ukuran: 20 MB per berkas

| Batas | Nilai | Alasan |
|---|---|---|
| Ukuran berkas | 20 MB | Base64 = +33%; 20 MB ≈ 27 MB teks, masih aman untuk satu tab |
| Teks Base64 yang ditempel | 20 MB karakter | Batas yang sama dari sisi teks |
| Isi `<textarea>` | 4 MB karakter | Di atas ini input mulai tersendat di perangkat kelas menengah |

Berkas yang melebihi batas ditolak **sebelum** dibaca (`File.size`), sehingga
tidak ada alokasi memori sia-sia. Pesan menyebut ukuran berkas dan batasnya.

Ini memperluas ADR-0005 yang menyatakan "tidak ada upload file di MVP": yang
dilarang tetap sama — **tidak ada berkas yang dikirim ke server**. Membaca berkas
lokal kini diizinkan, dengan batas eksplisit dan tanpa Web Worker (20 MB masih
di bawah ratusan milidetik untuk `btoa` native).

### 5. Pratinjau tanpa library

- Gambar: `<img>` dengan blob URL.
- PDF: `<object type="application/pdf">` — penampil bawaan browser. Bila tidak
  tersedia, ada teks fallback dan tombol unduh tetap bekerja.

Blob URL selalu di-revoke saat isi berubah atau komponen dilepas, agar memori
tidak menumpuk setelah beberapa konversi.

### 6. Data URL didukung penuh

Arah decode menerima `data:<mime>;base64,<isi>`; arah encode punya opsi
"Sertakan data URL" untuk menghasilkan bentuk siap tempel di CSS/HTML.

## Konsekuensi

**Positif**

- Kasus "tempel gambar sebagai Base64" dan "kirim PDF lewat JSON" selesai tanpa
  berpindah ke situs pihak ketiga.
- Privasi tetap utuh dan dapat diaudit: tes memastikan tidak ada `fetch` dan
  tidak ada isi berkas yang masuk storage.
- Tanpa dependensi baru; JS awal naik ~5 KB gzip.

**Negatif / dikendalikan**

- Memori: berkas 20 MB menjadi ~27 MB string Base64 di memori. Batas 20 MB
  dipilih supaya satu konversi besar masih aman; pesan batas harus jelas agar
  tidak terasa seperti bug.
- `<object>` PDF tidak bisa diuji di jsdom; tes memverifikasi atribut elemen dan
  jalur unduhan, bukan hasil render visual.
- Base64 gambar/PDF tidak "disunting" — area teksnya baca-saja. Menyunting Base64
  secara manual hampir selalu menghasilkan berkas rusak.

## Alternatif yang ditolak

- **Satu tool "File ⇄ Base64" untuk semua jenis** — pesan penolakan jadi kabur
  dan pratinjau harus menebak. Ditolak.
- **Mengunggah berkas ke server untuk konversi** — melanggar janji privasi dan
  CSP. Ditolak tanpa syarat.
- **Web Worker sejak awal** — transfer `ArrayBuffer` + kompleksitas untuk operasi
  yang selesai < 200 ms pada 20 MB. Ditunda sampai ada bukti (sama seperti ADR-0005).
- **Menebak jenis dari ekstensi/nama berkas** — gagal saat pengguna menempel
  Base64, dan mudah menipu. Ditolak.
