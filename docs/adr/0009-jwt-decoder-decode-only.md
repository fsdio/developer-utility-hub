# ADR-0009 — JWT Decoder: decode tanpa verifikasi, dan desain yang tidak bisa disalahartikan

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** backlog Phase 5/6 baris "JWT decoder — wajib banner 'bukan verifikasi signature'";
  blueprint §3.4 catatan keamanan dan §7 risk register ("JWT disalahartikan aman").

## Konteks

Blueprint menempatkan JWT Decoder sebagai kandidat ekspansi dengan satu catatan:
*"JWT Decoder hanya mendekode header/payload; itu bukan verifikasi signature atau
validasi token."* Risk register §7 menambahkan risiko "JWT disalahartikan aman"
dengan mitigasi "jelaskan bahwa decode bukan signature verification".

Masalahnya bukan teknis (memecah tiga segmen Base64URL itu mudah) melainkan
**desain dan kejujuran**. Tool decoder JWT yang populer sering:
- menampilkan "Token valid ✓" setelah berhasil decode, padahal itu hanya berarti
  struktur Base64URL + JSON-nya benar;
- menerima secret/key untuk "verifikasi" di sisi browser tanpa menjelaskan
  implikasinya;
- menyembunyikan alg `none` dan token yang signature-nya jelas tidak dicek.

Kesalahan paling berbahaya di sini adalah pengguna mengira token sudah
diverifikasi, lalu mengambil keputusan keamanan berdasarkan itu.

## Keputusan

### 1. Tool ini hanya men-decode. Titik.

- **Tidak ada** input secret, public key, JWKS, atau endpoint. Tanpa input kunci,
  tombol "verify" tidak mungkin ada, sehingga tidak ada janji palsu.
- Signature ditampilkan sebagai **string mentah** dengan label
  *"tidak diperiksa"*, bukan status centang.
- Tidak ada kata "valid", "aman", atau "verified" di UI untuk token yang
  sekadar berhasil di-decode. Kata yang dipakai: **"struktur terbaca"**.

### 2. Tiga lapis peringatan, bukan satu banner

1. **Sebelum input** (empty state): satu kalimat "Decoder ini tidak memverifikasi
   signature; token palsu pun akan tampil."
2. **Selalu terlihat** di atas hasil: banner tetap (bukan toast, tidak bisa
   ditutup) berisi "Signature tidak diverifikasi".
3. **Per-claim** untuk `exp`/`nbf`: status dihitung relatif terhadap waktu
   perangkat, dengan label yang tidak menyiratkan validitas token —
   `kedaluwarsa` / `belum berlaku` / `dalam rentang waktu`, disertai catatan
   bahwa itu hanya perbandingan waktu, bukan verifikasi.

### 3. Alg `none` dan alg lemah ditandai, bukan diblokir

Kalau header memuat `"alg":"none"`, UI menampilkan peringatan keras: token tanpa
signature. `HS256`/`RS256`/`ES256` ditampilkan sebagai informasi.
Kita **tidak** menilai keamanan algoritma — itu keputusan sistem penerbit, bukan
decoder. Menampilkan penilaian sendiri akan menjadi klaim yang tidak dapat
dipertanggungjawabkan.

### 4. Batasan yang dinyatakan di UI dan registry

- Tidak memeriksa `iss`, `aud`, atau rantai sertifikat.
- Tidak mendukung JWE (token 5 bagian) — ditolak dengan pesan eksplisit.
- Waktu perbandingan memakai jam perangkat pengguna, yang bisa saja salah.
- Payload JSON yang rusak dilaporkan sebagai error struktur, bukan ditebak.

### 5. Privasi tetap sama

Token JWT sering berisi data sensitif (email, sub, role). Karena itu:
token **tidak** disimpan, tidak masuk URL, tidak dikirim ke mana pun
(dijaga CSP `connect-src 'none'` dan audit `privacy.test.tsx`).

## Konsekuensi

- Tool ini berguna untuk inspeksi/debugging dan **tidak berguna** untuk
  memastikan token asli. Itu memang tujuannya.
- Tidak ada dependency JWT (tidak perlu `jose`), karena decode = Base64URL + JSON.
- Test harus mencakup: struktur bukan-3-bagian, segmen bukan Base64URL, payload
  bukan JSON, alg `none`, claim waktu kedaluwarsa/belum berlaku, dan
  memastikan tidak ada teks "valid"/"verified" di UI.

## Alternatif yang ditolak

- **Menerima secret untuk verifikasi HS256 di browser**: mengundang orang
  menempelkan secret produksi ke situs statis. Ditolak mutlak.
- **Verifikasi offentliche key/JWKS dengan fetch**: melanggar `connect-src 'none'`
  dan prinsip privasi; juga menciptakan janji keamanan yang salah sasaran.
- **Menampilkan badge "Token valid"**: persis kesalahan yang ADR ini cegah.
- **Tool `planned` di registry tanpa implementasi**: membran gantung di katalog.
