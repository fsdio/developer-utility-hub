# Developer Utility Hub

Kumpulan utility kecil untuk developer yang **berjalan sepenuhnya di browser**.
Tidak ada backend, tidak ada akun, dan isi input tidak pernah dikirim atau disimpan.

Produk ini adalah satu situs statis berisi banyak utility independen dengan
pengalaman penggunaan yang konsisten. Lihat `docs/developer-utility-hub-blueprint.md`
untuk arah produk, dan `docs/PRD.md` untuk spesifikasi.

## Tools (20)

**Inti (MVP)**

| Tool | Kategori | Yang dilakukan |
|---|---|---|
| [Case Converter](#/tools/case-converter) | Text | 9 gaya penulisan sekaligus, dengan aturan akronim yang eksplisit |
| [JSON Formatter](#/tools/json-formatter) | Formatter | Format, minify, validasi + error berposisi (baris/kolom) |
| [XML Formatter](#/tools/xml-formatter) | Formatter | Format/minify dengan komentar & processing instruction dipertahankan |
| [Text Diff](#/tools/text-diff) | Diff | Diff baris + highlight karakter, opsi ignore case/whitespace |
| [JSON Diff](#/tools/json-diff) | Diff | Diff struktural per JSON Pointer + JSON Patch deskriptif |

**Encode & Decode**

| Tool | Yang dilakukan |
|---|---|
| [Base64 Encode / Decode](#/tools/base64) | UTF-8 aman, varian URL-safe, wrap 76 karakter |
| [Gambar ⇄ Base64](#/tools/image-base64) | PNG/JPEG/GIF/WEBP/SVG/BMP/AVIF ke Base64 dan sebaliknya |
| [PDF ⇄ Base64](#/tools/pdf-base64) | PDF ke Base64/data URL dan sebaliknya, dengan pratinjau |
| [URL Encode / Decode](#/tools/url-encoder) | Percent-encoding mode komponen dan form |
| [HTML Entity Encode / Decode](#/tools/html-entity) | Named + numerik, tanpa menyentuh DOM |
| [String Escape / Unescape](#/tools/escape) | JSON, JavaScript, HTML, SQL, XML |
**Auth & Token**

| Tool | Yang dilakukan |
|---|---|
| [Hash Generator](#/tools/hash) | SHA-256 / SHA-512 / SHA-1 dalam hex dan base64 |
| [JWT Decoder](#/tools/jwt) | Decode header/payload — **signature tidak diverifikasi** |
| [JWT Verifier](#/tools/jwt-verify) | Cocokkan signature dengan kunci yang kamu tempel + audit `exp`/`nbf`/`iss`/`aud` |
| [Basic Auth Encode / Decode](#/tools/basic-auth) | `user:pass` ⇄ `Authorization: Basic …`, dua arah di satu form |
| [API Key Generator](#/tools/api-key) | Token acak kriptografis + sidik jari SHA tanpa menyimpan token asli |

**Konversi**

| Tool | Yang dilakukan |
|---|---|
| [UUID Generator](#/tools/uuid) | v4 acak dan v7 berurutan waktu (Web Crypto) |
| [Unix Timestamp Converter](#/tools/timestamp) | Epoch ⇄ tanggal, UTC dan lokal berdampingan |
| [Color Converter](#/tools/color) | HEX / RGB / HSL dua arah + pratinjau |
| [Number Base Converter](#/tools/number-base) | Biner / oktal / desimal / heksadesimal (BigInt) |

Sengaja **belum** ada, dengan alasan tertulis: Regex Tester (ADR-0008), SQL
Formatter, dan XML Diff — lihat `docs/adr/0007-phase-5-scope.md`. JWT Decoder ada,
tetapi **hanya untuk decode** dan tidak akan pernah menerima secret/key (ADR-0009);
verifikasi signature ada di tool terpisah yang hanya memakai kunci yang kamu
tempel, tanpa JWKS dan tanpa jaringan (ADR-0018).

## Menjalankan

Butuh Node.js 20.19+ atau 22.12+.

```bash
npm ci
npm run dev            # http://localhost:5173
```

Build dan verifikasi penuh (dipakai CI):

```bash
npm run build          # dist/ + 404.html + .nojekyll + version.json
npm run verify         # lint → typecheck → test → build → boundaries → bundle → kontras → preview
```

Base path situs **default `/`** (custom domain `developerutilityhub.web.id`,
ADR-0016). Untuk membangun versi project page `fsdio.github.io/developer-utility-hub/`:

```bash
VITE_BASE_PATH=/developer-utility-hub/ npm run build
```

Perintah lain:

```bash
npm test               # Vitest (unit + component + a11y)
npm run lint
npm run typecheck
npm run coverage
npm run preview        # serve dist/ lokal
```

## Struktur

```
src/
├── app/            shell, router hash, error boundary, host route tool
├── components/     layout, navigation, editor, komponen bersama
├── features/       satu folder per tool + halaman statis
├── lib/            engine murni: text, json, xml, diff, encoding, dev, browser
├── registry/       tools.ts — satu-satunya sumber metadata tool
├── hooks/          useDebouncedValue, useCopy, useHashRoute, useTheme, …
├── styles/         tokens.css (design tokens), base.css
└── test/           setup, helper render, audit privasi, audit aksesibilitas
```

Aturan ketergantungan yang **ditegakkan skrip** (`npm run check:boundaries`):
engine di `src/lib/{text,json,xml,diff}` tidak boleh mengimpor React atau menyentuh
`window`/`document`. Itu sebabnya engine menerima `DOMParser` sebagai parameter.

## Privasi

- Isi input tidak dikirim ke server: CSP build menetapkan `connect-src 'self'`,
  sehingga hanya origin situs ini yang boleh dihubungi — praktisnya satu berkas
  `version.json` untuk cek build baru (tidak pernah membawa isi input).
- Isi input tidak disimpan: tidak ada di `localStorage`, URL, atau riwayat.
- Berkas (gambar/PDF) dibaca dari disk Anda dan diproses di memori — tidak
  pernah diunggah, tidak pernah masuk storage (ADR-0017).
- Yang disimpan hanya preferensi tampilan (`duh:v1:theme`, indent, opsi diff).
  Daftar lengkap ada di halaman `#/privacy` dan berasal dari satu konstanta di kode.
- Audit ini otomatis: `src/test/privacy.test.tsx`.

## Keputusan teknis

Lihat `docs/adr/` — aturan case conversion, semantik JSON Diff, kebijakan fidelity
XML, status XML↔JSON, batas ukuran input, dan pilihan stack/versi.

## Deployment

Situs produksi: **https://developerutilityhub.web.id/** (GitHub Pages + domain
kustom, HTTPS enforced). Deploy otomatis dari `main` lewat
`.github/workflows/deploy.yml`; `public/CNAME` menjaga domain tetap terpasang.
Detail DNS dan langkah pindah domain ada di ADR-0016.

## Kontribusi

Baca `CONTRIBUTING.md`. Semua perubahan perilaku harus dapat ditelusuri ke
`docs/PRD.md` atau ADR; dependency baru butuh alasan tertulis.

## Lisensi

MIT — lihat [LICENSE](LICENSE).
