# ADR-0007 — Isi Phase 5 dan apa yang sengaja ditunda

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** `docs/backlog.md` bagian "Backlog ekspansi (Phase 5)" dan
  blueprint §11 Phase 5.

## Konteks

Blueprint §11 mencantumkan calon ekspansi: Base64, URL Encoder/Decoder, UUID,
Timestamp, SQL Formatter, Regex Tester, JWT Decoder, XML Diff, HTML Entity.
Backlog menambahkan beberapa item (hash, escape/unescape, color/number converter)
dengan catatan: Regex butuh ADR ReDoS, SQL "evaluasi ulang", XML Diff "tentukan
tekstual vs struktural", JWT wajib banner.

Menambahkan semua sekaligus melanggar prinsip blueprint §4. ADR ini memutuskan
mana yang masuk, mana yang ditunda, dan apa alasan tiap penundaan.

## Keputusan

### Masuk Phase 5 (9 tool baru)

| ID | Tool | Alasan masuk |
|---|---|---|
| `base64` | Base64 Encode / Decode | Sangat sering dipakai; murni string + `TextEncoder` (UTF-8 aman) |
| `url-encoder` | URL Encode / Decode | Sering dipakai; `encodeURIComponent` + penjelasan `+` vs `%20` |
| `html-entity` | HTML Entity Encode / Decode | Melengkapi encoding; tanpa `innerHTML` (decoder tabel + numerik) |
| `escape` | String Escape / Unescape | JSON, JS, HTML, SQL, XML dalam satu tool; murni string |
| `uuid` | UUID Generator | `crypto.randomUUID()` + fallback `getRandomValues` (v4 & v7) |
| `hash` | SHA-256 / SHA-512 Generator | Web Crypto (async), diisolasi agar engine tetap sinkron-murni |
| `timestamp` | Unix Timestamp Converter | Biasa dipakai saat debugging; UTC & zona lokal eksplisit |
| `color` | Color Converter | HEX/RGB/HSL; kecil, deterministik, mudah diuji |
| `number-base` | Number Base Converter | Biner/oktal/desimal/heksadesimal + batas `BigInt` |

Semua di atas **tidak** butuh dependency baru. Nol dependency tambahan.

### Ditunda, dengan alasan eksplisit

| Tool | Keputusan | Alasan |
|---|---|---|
| Regex Tester | **Ditunda** (ADR-0008) | Butuh mitigasi ReDoS; memasang "timeout" di main thread memberi rasa aman palsu |
| SQL Formatter | **Ditunda** | Hanya realistis dengan parser/dialek (dependency besar). Menulis formatter SQL sendiri untuk banyak dialek = bug generator. SQL Formatter di roadmap Phase 6 bila ada permintaan nyata |
| JWT Decoder | **Ditunda** | Berisiko tinggi disalahpahami sebagai verifikasi token. Butuh desain microcopy + UI yang tidak bisa disalahartikan; tidak cukup waktu untuk mengerjakannya dengan benar sekarang |
| XML Diff | **Ditunda** | Belum diputuskan tekstual vs struktural (ADR-0004 semangat yang sama: jangan mencampur tanpa pilihan jelas) |
| JSON↔XML conversion | Tetap ditunda | ADR-0004 masih berlaku |
| File comparison, favorites, recent, command palette penuh | Tetap ditunda | Blueprint §5: tunggu kebutuhan nyata |

### Aturan lintas-tool untuk Phase 5

1. **Kejujuran kriptografi**: hash, Base64, dan URL encoding bukan enkripsi. Setiap
   tool menyatakannya di `limitations` registry dan di UI.
2. **Hash tidak menyimpan apa pun**: hasil hash hanya di layar; tidak ada
   auto-copy diam-diam.
3. **Async**: hanya Hash yang memakai Web Crypto (async). Halaman menampilkan
   status "menghitung…" dan menangani kegagalan `crypto.subtle` (non-secure
   context) dengan pesan yang jelas, bukan crash.
4. **Random**: UUID wajib `crypto.randomUUID()` bila tersedia; fallback
   `crypto.getRandomValues` (bukan `Math.random`). Tidak ada promise keamanan
   kriptografis lebih dari yang disediakan platform.
5. **Batas input**: tetap 1.000.000 karakter (ADR-0005) untuk semua tool baru.
6. **Zona waktu**: tool timestamp selalu menampilkan **UTC dan lokal** berdampingan
   agar tidak ada ambiguitas saat debugging.

## Konsekuensi

- Registry bertambah 9 entri pada kategori baru `utilities` (yang sebelumnya
  kosong dan tidak dirender — IA §1 memastikan kategori otomatis muncul).
- Nav header menampilkan kategori "Utilities" setelah tool pertama terdaftar.
- `check:bundle` harus tetap < 200 KB gzip walau tool bertambah; semua tool baru
  tetap lazy-loaded per chunk.
- Test bertambah untuk 9 engine + 9 halaman.

## Alternatif yang ditolak

- **Memasukkan ke-15 kandidat sekaligus**: kualitas tidak merata, risiko bug tinggi.
- **Memakai library `sql-formatter`/`jsonwebtoken`/`html-entities`**: menambah
  dependency untuk pekerjaan yang bisa ditunda dengan jujur.
- **Regex tester dengan `setTimeout`**: tidak menghentikan regex yang sedang
  berjalan di main thread; itu menyesatkan (lihat ADR-0008).
