# ADR-0018 — Tool autentikasi: verifikasi JWT, Basic Auth, dan generator API key

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** permintaan fitur "decode, encode, verify untuk jenis authentication
  yang populer dipakai komersial" dan pertanyaan blueprint §3.4 tentang batas
  tool token
- **Terkait:** ADR-0009 (JWT Decoder decode-only), ADR-0014 (satu form satu
  aksi), ADR-0011 (form tanpa teks pengapit), ADR-0005 (batas ukuran input)

## Konteks

ADR-0009 mengunci JWT Decoder sebagai **decode-only**: tool itu tidak menerima
secret maupun public key, dan itu tetap berlaku. Kebutuhan nyata di pekerjaan
sehari-hari justru muncul tepat setelah decode: "signature token ini cocok
dengan kunci yang saya punya, atau tidak?" Pertanyaan itu tidak bisa dijawab
dengan decode.

Tiga mekanisme autentikasi paling sering dipakai sistem komersial:

| Mekanisme | Yang dicari developer | Risiko bila salah |
|---|---|---|
| JWT/JWS | "kenapa token ditolak?" — signature, `exp`, `iss`, `aud` | Menyimpulkan token asli padahal signature tidak dicocokkan |
| Basic Auth | encode `user:pass` → header; decode header lama | Mengira Base64 = enkripsi |
| API key | membuat token acak bermutu, memeriksa kunci tanpa menyimpan aslinya | Token lemah/bias, kunci bocor di log |

Batasan produk tidak berubah: tanpa backend, tanpa akun, tanpa `fetch` data
pengguna, dan isi input tidak pernah masuk storage.

## Keputusan

### 1. JWT Decoder tetap decode-only; verifikasi jadi tool terpisah

Tool baru `jwt-verify` (`#/tools/jwt-verify`) menangani verifikasi. Pemisahan ini
disengaja: halaman decode tidak boleh terlihat seolah bisa "mempercayai" token.
Di halaman verifikasi, kunci hanya dipakai untuk mencocokkan signature dengan
`crypto.subtle.verify`, dengan kunci yang **ditempel pengguna**.

Yang secara eksplisit **tidak** dilakukan tool ini:

- tidak mengambil JWKS atau membuka koneksi jaringan apa pun;
- tidak menyimpulkan penerbit tepercaya (`iss` hanya dicocokkan dengan teks yang
  pengguna ketik sendiri);
- tidak menerima kunci privat — PEM `PRIVATE KEY` ditolak dengan pesan yang
  menjelaskan bahwa yang dibutuhkan kunci publik.

Algoritma yang didukung: HS256/384/512 (secret sebagai UTF-8 apa adanya),
RS256/384/512, PS256/384/512 (RSA-PSS), ES256/384/512, dan EdDSA — semuanya
lewat WebCrypto, tanpa dependensi baru. `alg: none` selalu dilaporkan sebagai
"tidak ada signature" (`unverified`), bukan sebagai valid.

### 2. Satu halaman verifikasi = satu aksi

Toolbar memuat aksi utama **Verifikasi**, pilihan algoritma kunci, tombol
"Pakai alg dari token", satu `CopyButton` (payload), dan Reset — sesuai ADR-0014.
Hasil verifikasi dan audit klaim tampil di panel, bukan di bawah form, dan
verdict diulang di footer panel supaya terbaca tanpa menggulir.

Audit klaim selalu menyebut batasnya:

- `exp`/`nbf` dibandingkan dengan **jam perangkat**, dengan toleransi 0 detik;
- `i_*`/`iss`/`aud` hanya cocok dengan nilai yang diketik pengguna;
- klaim yang tidak ada dilaporkan sebagai `gap`, bukan "aman".

### 3. Basic Auth: satu panel, dua arah

`basic-auth` memakai satu `CodeArea` untuk header dan dua input untuk username
dan password. "Buat header" mengisi header dari kredensial; "Baca header"
mengisi kredensial dari header. Semua hasil masuk ke form yang sama, jadi tidak
ada panel hasil kedua dan tidak ada tombol salin per baris.

Tool **menolak** mengklaim keamanan: teks bawaannya menyebut Basic Auth hanya
Base64, bukan enkripsi, dan menyarankan HTTPS. Encoding memakai UTF-8, dan
username yang memuat `:` ditolak karena akan menggeser pemisah.

### 4. API key: generator + sidik jari, tanpa penyimpanan

`api-key` memakai `crypto.getRandomValues` dengan **rejection sampling** supaya
setiap karakter benar-benar seragam (tanpa bias modulo). Pilihan: alfabet
`base64url` (64), `alnum` (62), `hex` (16), panjang 24–64, dan awalan opsional
(mis. `sk_live_`) yang tidak dihitung sebagai entropi.

Aksi kedua adalah **Sidik jari**: hash SHA-256/512/1 dari token yang sedang
tampil, ditampilkan dalam hex dan Base64 — pola yang dipakai sistem nyata untuk
memeriksa kunci tanpa menyimpan aslinya. Token hanya hidup di state React;
menutup tab menghapusnya, dan tool mengatakannya terang-terangan.

## Konsekuensi

- Kategori baru `auth` ("Auth & Token") berisi 4 tool: Hash Generator (SHA),
  JWT Decoder, JWT Verifier, Basic Auth, dan API Key Generator.
- Registry naik dari 17 menjadi 20 tool; uji registry, katalog, aksesibilitas,
  privasi, dan satu-tombol-salin ikut diperbarui.
- Semua operasi kripto memakai WebCrypto: tidak ada dependency baru, dan bundel
  JS awal tetap di bawah anggaran 200 KB.
- Karena verifikasi sepenuhnya lokal, tool tidak bisa menjawab "apakah kunci ini
  milik penerbit yang benar" — itu memang di luar cakupan produk tanpa backend.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| Menambah input kunci ke JWT Decoder | Melanggar ADR-0009 dan mengaburkan beda decode vs verifikasi |
| Mengambil JWKS dari `https://…/.well-known/jwks.json` | Butuh jaringan, membocorkan issuer yang diperiksa, dan menciptakan klaim "tepercaya" yang tidak bisa dijamin situs statis |
| OAuth/OIDC + PKCE builder | Alur butuh client secret & redirect URI nyata; nilai edukasinya lebih tinggi dari utilitas harian — tetap di backlog bila diminta |
| Generator token dengan `Math.random` | Tidak layak untuk kredensial; bias modulo juga tidak terdeteksi pengguna |
| Menyimpan token terakhir di localStorage | Melanggar janji privasi (PRD §3) dan menjadikan kunci bocor permanen |
