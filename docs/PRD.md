# PRD — Developer Utility Hub (MVP)

> Turunan langsung dari `docs/developer-utility-hub-blueprint.md` §15 langkah 1.
> **Versi:** 1.0 · **Tanggal:** 2026-11-12 · **Status:** Disetujui untuk implementasi
> **Scope:** Phase 1 + Phase 2 (Foundation + 5 Core Utilities). Phase 3–5 di luar PRD ini.

---

## 1. Ringkasan

Developer Utility Hub adalah satu situs statis berisi utility kecil untuk developer.
Semua pemrosesan terjadi di browser; tidak ada backend, tidak ada akun, tidak ada
input yang dikirim atau disimpan.

Nilai utama: menyelesaikan pekerjaan kecil (format, konversi, diff) dalam hitungan
detik tanpa membuka banyak tab atau menulis script sementara.

---

## 2. Persona dan Kebutuhan

| Persona | Situasi | Yang dibutuhkan |
|---|---|---|
| Backend developer | Menelusuri response API yang tidak ter-format | JSON/XML formatter cepat, tanpa upload data |
| Frontend developer | Mengubah nama variabel/filename ke konvensi lain | Case converter dengan aturan akronim yang benar |
| QA engineer | Membandingkan dua response | Text diff dan JSON diff yang deterministik |
| Software engineer | Membedah log/payload berantakan | Formatter dengan error yang menjelaskan lokasi masalah |

---

## 3. Prinsip yang Mengikat Implementasi

1. **Browser-first**: tidak ada request jaringan yang membawa input pengguna.
2. **Tidak ada persistensi input**: input tidak ditulis ke `localStorage`,
   `sessionStorage`, IndexedDB, cookie, atau URL. Yang boleh dipersist hanya
   preferensi tampilan (tema, indent default, opsi diff).
3. **Deterministik**: input yang sama menghasilkan output yang sama, selalu.
4. **Error harus berguna**: pesan error menyebut posisi (baris/kolom atau path)
   dan penyebabnya dalam bahasa yang bisa ditindaklanjuti.
5. **Jujur soal keterbatasan**: setiap tool menyatakan apa yang tidak dilakukannya
   (mis. JSON Diff bukan verifikasi, XML formatter membuang komentar sesuai opsi).

---

## 4. Scope MVP

### 4.1 In scope

| ID | Tool | Kategori | Route |
|---|---|---|---|
| `case-converter` | Case Converter | Text | `#/tools/case-converter` |
| `json-formatter` | JSON Formatter | Formatter | `#/tools/json-formatter` |
| `xml-formatter` | XML Formatter | Formatter | `#/tools/xml-formatter` |
| `text-diff` | Text Diff | Diff | `#/tools/text-diff` |
| `json-diff` | JSON Diff | Diff | `#/tools/json-diff` |

Plus: halaman beranda (katalog tools), halaman per tool, halaman 404, halaman
Community (link ke GitHub Issues), halaman Privacy singkat, dark/light theme,
pencarian tools di header, copy, reset, dan download hasil.

### 4.2 Out of scope (dieksplisitkan agar tidak menyelinap masuk)

- Akun, login, sinkronisasi, riwayat lintas sesi.
- Backend, database, server-side rendering, analytics.
- XML ↔ JSON conversion (backlog; lihat ADR-0004).
- XML Diff, file comparison, favorites, recent tools, command palette `Ctrl+K`.
- Upload file sebagai input (hanya paste/type di MVP; tombol *Load file* ditunda).
- i18n: UI berbahasa **Indonesia**, istilah teknis dibiarkan dalam bahasa Inggris.
- Kolaborasi, sharing via URL yang memuat isi dokumen.

---

## 5. User Stories

- **US-1** Sebagai developer, saya membuka beranda dan menemukan tool yang saya
  butuhkan lewat pencarian atau kategori, lalu masuk ke halaman tool dalam sekali klik.
- **US-2** Sebagai developer, saya menempel teks dan mengonversi ke 9 gaya case,
  lalu menyalin satu hasil tertentu tanpa menyalin semuanya.
- **US-3** Sebagai developer, saya menempel JSON rusak dan mendapat pesan error
  dengan baris/kolom yang tepat, bukan "Unexpected token".
- **US-4** Sebagai QA, saya membandingkan dua teks dan melihat baris serta
  karakter mana yang berubah, dengan pilihan ignore case/whitespace.
- **US-5** Sebagai QA, saya membandingkan dua JSON dan mendapat daftar perubahan
  per path, bukan sekadar perbedaan string.
- **US-6** Sebagai developer, saya memakai tool dengan keyboard saja (tanpa mouse).
- **US-7** Sebagai pengguna, saya yakin data saya tidak dikirim ke mana pun dan
  bisa membaca penjelasan singkat tentang itu.

---

## 6. Spesifikasi Fungsional per Tool

Semua tool tunduk pada kontrak bersama ini.

### 6.0 Kontrak perilaku bersama

| Aspek | Aturan |
|---|---|
| Batas input | 1.000.000 karakter (≈1 MB) per panel. Melebihi batas → tool menolak memproses dan menampilkan peringatan, input tetap dipertahankan. Lihat ADR-0005. |
| Debounce pemrosesan | 200 ms setelah perubahan terakhir; pemrosesan sinkron (tanpa Web Worker) di MVP. |
| Copy | `navigator.clipboard.writeText`; bila gagal/tidak tersedia → fallback `textarea` + `document.execCommand('copy')`; bila keduanya gagal → tampilkan instruksi manual. Selalu ada umpan balik status (Berhasil / Gagal). |
| Reset | Mengosongkan input dan output, mengembalikan opsi ke default, memindahkan fokus ke input. |
| Download | `Blob` + `URL.createObjectURL`, nama file berisi tanggal (`case-converter-2026-11-12.txt`). Objek URL selalu di-`revoke`. |
| Empty state | Output kosong menampilkan petunjuk singkat, bukan area kosong tanpa keterangan. |
| Keyboard | `Ctrl/Cmd+Enter` = proses utama (bila tool punya aksi eksplisit), `Escape` = reset dengan konfirmasi bila ada isi, semua kontrol dapat dicapai dengan `Tab`, fokus terlihat jelas. |
| Preferensi | Hanya `theme`, `case-converter:lastStyle`, `json-formatter:indent`, `text-diff:ignoreCase/ignoreWhitespace`. Kunci localStorage memakai prefix `duh:v1:`. |

### 6.1 Case Converter (`case-converter`)

**Input:** satu textarea bebas.
**Output:** 9 gaya sekaligus, ditampilkan sebagai daftar baris; tiap baris punya
tombol copy sendiri.

Gaya: `UPPERCASE`, `lowercase`, `Title Case`, `Sentence case`, `camelCase`,
`PascalCase`, `snake_case`, `kebab-case`, `CONSTANT_CASE`.

**Algoritma (mengikat, lihat ADR-0001):**

1. **Tokenisasi** input menjadi daftar kata:
   - Pisahkan pada whitespace dan separator: `_ - . / \ : ; , | + & @ # ~ ! ? ( ) [ ] { } < > " '`.
   - Pisahkan pada batas `lower→UPPER` (`userID` → `user`, `ID`).
   - Pisahkan pada batas `UPPER+lowers` (`HTTPResponse` → `HTTP`, `Response`).
   - Pisahkan pada batas **angka→huruf** (run angka yang langsung diikuti huruf),
     tetapi **tidak** memisahkan huruf→angka: `v2Api` → `v2`, `Api`; `sha256sum` → `sha256`, `sum`.
     Alasan: angka biasanya berfungsi sebagai sufiks (`sha256`, `v2`), bukan kata terpisah.
   - Buang token kosong; jangan menormalkan diakritik (`café` tetap `café`).
2. **Normalisasi tiap token** ke lowercase sebelum digabung kembali (kecuali gaya
   yang mempertahankan huruf asli seperti `UPPERCASE`/`lowercase`/`Sentence case`/`Title Case`).
3. **Gabung** sesuai gaya:
   - `camelCase`: token[0] lowercase + sisa Capitalized.
   - `PascalCase`: semua Capitalized.
   - `snake_case` / `kebab-case` / `CONSTANT_CASE`: join dengan `_` / `-` / `_`, case lowercase/lowercase/upper.
   - `Title Case` / `Sentence case` / `UPPERCASE` / `lowercase` **beroperasi pada teks asli**,
     bukan hasil tokenisasi: `Title Case` mengapitalkan huruf pertama setiap kata
     dipisah spasi, `Sentence case` mengapitalkan huruf pertama teks dan setelah
     `.`/`!`/`?` diikuti spasi, sisanya lowercase.

**Kasus uji wajib (harus lulus di unit test):**

| Input | camelCase | snake_case | kebab-case | CONSTANT_CASE |
|---|---|---|---|---|
| `hello world` | `helloWorld` | `hello_world` | `hello-world` | `HELLO_WORLD` |
| `userID` | `userId` | `user_id` | `user-id` | `USER_ID` |
| `HTTPResponse` | `httpResponse` | `http_response` | `http-response` | `HTTP_RESPONSE` |
| `v2Api` | `v2Api` | `v2_api` | `v2-api` | `V2_API` |
| `sha256sum` | `sha256Sum` | `sha256_sum` | `sha256-sum` | `SHA256_SUM` |

PascalCase untuk kasus di atas: `HelloWorld`, `UserId`, `HttpResponse`, `V2Api`, `Sha256Sum`.

**Keputusan eksplisit:** akronim **tidak** dipertahankan huruf besarnya. `userID`
menjadi `userId`, bukan `userID`. Ini dipilih agar hasil deterministik dan dapat
diprediksi; mempertahankan akronim membutuhkan kamus yang tidak bisa diuji secara umum.
Lihat ADR-0001.

Input kosong → semua output kosong, tanpa error.

### 6.2 JSON Formatter (`json-formatter`)

**Aksi:** Format (beautify), Minify, Validasi.

| Fitur | Perilaku |
|---|---|
| Format | `JSON.parse` lalu `JSON.stringify(value, null, indent)`, `indent` ∈ {2, 4, tab}. |
| Minify | `JSON.stringify(value)` tanpa spasi. |
| Validasi | Parse; sukses → tampilkan ringkasan (tipe root, jumlah key/elemen terdalam); gagal → error terstruktur. |
| Error | Ambil `position` dari `SyntaxError` (dukungan V8), konversi ke **baris & kolom**, tampilkan cuplikan 3 baris di sekitar posisi dengan penanda `^`. Bila posisi tak tersedia, tampilkan pesan mentah + saran. |
| Preserve angka besar | Tidak dilakukan: `JSON.parse` memakai `Number`. Angka > 2^53 bisa berubah presisi — **dinyatakan di UI** sebagai catatan keterbatasan. |
| Duplicate key | Perilaku `JSON.parse` (key terakhir menang) — disebutkan di catatan tool. |
| Copy / Reset / Download | Sesuai §6.0; download `.json`. |

### 6.3 XML Formatter (`xml-formatter`)

**Aksi:** Format (indent), Minify, Validasi.

| Aspek | Aturan |
|---|---|
| Parse | `DOMParser` dengan `application/xml`; deteksi `<parsererror>` (cek `getElementsByTagName('parsererror')` **dan** elemen dengan namespace parsererror, karena perilaku berbeda antar browser). |
| Format | Serializer sendiri yang mempertahankan: elemen, atribut (urutan asli), namespace prefix, text content, dan — sesuai opsi — komentar serta processing instruction. Indent 2/4 spasi. |
| Minify | Buang whitespace antar-tag saja (whitespace di dalam text node dipertahankan), buang komentar bila opsi *preserve comments* mati. |
| Opsi `preserveComments` | Default **aktif**. Bila dimatikan, komentar dibuang dan UI menyatakan bahwa output kehilangan komentar. |
| Fidelity (jujur ke pengguna) | MVP **tidak** menjamin round-trip: CDATA diserialisasi ulang menurut isi teks; entity kustom (`&foo;`) bisa gagal parse dan dilaporkan sebagai error; deklarasi `<?xml ... ?>` dipertahankan hanya bila ada di input. Lihat ADR-0003. |
| Error | Pesan parser berisi baris/kolom bila tersedia; di dalam `<parsererror>` ambil teks, bukan HTML. |
| Copy / Reset / Download | Download `.xml`. |

### 6.4 Text Diff (`text-diff`)

Dua panel input: **Original** (kiri) dan **Modified** (kanan). Hasil ditampilkan
sebagai satu daftar baris terpadu (unified), opsional dua kolom.

| Fitur | Perilaku |
|---|---|
| Algoritma | `diffLines` dari library `diff`; untuk perubahan dalam satu baris, `diffChars` pada pasangan baris tersebut. |
| Tampilan | Baris `added` hijau, `removed` merah, `modified` kuning dengan highlight karakter di dalam baris. Nomor baris kiri/kanan. |
| Ringkasan | `+N added · -M removed · ~K modified`. |
| Opsi | `ignoreCase` (normalisasi sebelum diff), `ignoreWhitespace` (`trim` tiap baris + bandingkan tanpa whitespace berlebih). Opsi mengubah **pembandingan**, bukan teks yang ditampilkan. |
| Swap | Menukar isi kedua panel, lalu menghitung ulang. |
| Sinkronisasi scroll | Bila mode dua kolom aktif, scroll kedua panel disinkronkan secara proporsional. |
| Copy / Download | Copy hasil diff sebagai teks unified (`+`/`-`/` `); download `.diff`. |
| Batas | 1.000.000 karakter total; peringatan bila terlampaui. |

### 6.5 JSON Diff (`json-diff`)

Perbandingan **berbasis struktur**, bukan string. Lihat ADR-0002.

**Aturan semantik:**

1. Urutan key object **diabaikan**.
2. Urutan elemen array **dianggap bermakna** (index-based).
3. Perubahan dikategorikan: `added`, `removed`, `changed`, `type-changed`
   (mis. `string` → `number` pada path yang sama). `type-changed` dihitung sebagai
   `changed` dengan penanda tipe.
4. Setiap perubahan punya `path` bergaya JSON Pointer (RFC 6901), mis. `/users/0/name`.
5. Kedua input harus JSON valid. Bila salah satu invalid → tampilkan error
   terstruktur per panel, tidak ada hasil diff.
6. Opsi `ignoreKeyOrder` **selalu aktif** (tidak bisa dimatikan di MVP);
   opsi `ignoreArrayOrder` ditunda ke backlog.

**Keluaran (mengikat):** dua tampilan yang bisa dipilih pengguna —

- **Tampilan Path** (default, human-readable): tabel `path · jenis · nilai lama → nilai baru`.
- **Tampilan Patch**: JSON Patch RFC 6902 yang dihasilkan dari daftar perubahan,
  bisa dicopy. Patch ini **deskriptif**, bukan dijamin apply-able untuk operasi
  `move`/`copy` (MVP tidak menghasilkan op tersebut).

Ringkasan: `+N · -M · ~K`.

---

## 7. Acceptance Criteria

### 7.1 Umum (berlaku untuk semua tool)

- [ ] Menampilkan nama, deskripsi satu kalimat, dan catatan keterbatasan tool.
- [ ] Input tervalidasi; error dapat dipahami dan menyebut lokasi bila relevan.
- [ ] Output benar sesuai kasus uji di PRD dan unit test.
- [ ] Copy, Reset berfungsi; Download tersedia untuk tool yang menghasilkan dokumen.
- [ ] Tidak ada request jaringan yang memuat isi input (dibuktikan via test/manual check).
- [ ] Tidak ada isi input di localStorage/sessionStorage/URL (dibuktikan via test).
- [ ] Dapat dipakai penuh dengan keyboard; fokus terlihat; label form terhubung.
- [ ] Berfungsi pada viewport 360 px dan 1280 px.
- [ ] Unit test untuk logic inti; component test untuk alur utama tiap tool.

### 7.2 MVP (definisi rilis)

- [ ] Lima tool dapat digunakan ujung ke ujung.
- [ ] `npm run build` berhasil; `npm run lint` dan `npm test` hijau di CI.
- [ ] Build `preview` berfungsi saat di-serve dari subpath `/developer-utility-hub/`
  (aset dan hash route tidak 404).
- [ ] README memuat cara menjalankan, cara kontribusi, dan penjelasan privasi.
- [ ] Tautan feature request dan bug report menuju GitHub Issues dengan template.
- [ ] Tidak ada secret/credential di repo atau bundle.
- [ ] Halaman Privacy menjelaskan apa yang tidak disimpan dan apa yang disimpan
  (hanya preferensi tampilan).

---

## 8. Metrik Keberhasilan (post-rilis, tanpa melacak isi input)

- Waktu dari membuka halaman ke hasil valid pertama < 10 detik (uji kegunaan manual).
- LCP < 2,5 s pada koneksi 4G tersimulasi, JS awal < 200 KB gzip.
- Rasio error tool (dari laporan issue) menurun tiap rilis.
- Tidak ada laporan kebocoran data input.

---

## 9. Risiko Tingkat PRD

| Risiko | Dampak | Mitigasi di MVP |
|---|---|---|
| Aturan case conversion dirasa "salah" oleh sebagian pengguna | Tool terasa rusak | Aturan didokumentasikan di UI (tautan "Cara kerja"), kasus uji dipublikasikan |
| JSON Diff menghasilkan patch yang tidak bisa di-apply | Kepercayaan turun | Patch diberi label "deskriptif", bukan "apply-able" |
| XML formatter mengubah dokumen | Data pengguna rusak | Opsi preserve comments, catatan fidelity eksplisit, tanpa round-trip claim |
| Input besar membekukan UI | Tool dianggap hang | Batas 1 MB + peringatan, debounce 200 ms, pekerjaan dipisah per render |
| Microcopy salah soal keamanan | Pengguna salah paham | Setiap tool punya "catatan keterbatasan" wajib |

---

## 10. Traceability

| Kebutuhan blueprint | Dokumen ini |
|---|---|
| §3.1 Case Converter | §6.1 |
| §3.2 JSON/XML Formatter | §6.2, §6.3 |
| §3.3 Text Diff, JSON Diff | §6.4, §6.5 |
| §3.3 XML Diff / file comparison | §4.2 (out of scope) |
| §3.2 XML↔JSON conversion | §4.2 + ADR-0004 |
| §4 MVP 5 tool | §4.1 |
| §5 UX & perilaku umum | §6.0, `docs/ui-specification.md` |
| §7 privasi & risiko | §3, §9 |
| §11 Phase 1–2 | `docs/backlog.md` |
| §12 acceptance criteria | §7 |
