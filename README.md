# Developer Utility Hub

Kumpulan utility kecil untuk developer yang **berjalan sepenuhnya di browser**.
Tidak ada backend, tidak ada akun, dan isi input tidak pernah dikirim atau disimpan.

Produk ini adalah satu situs statis berisi banyak utility independen dengan
pengalaman penggunaan yang konsisten. Lihat `docs/developer-utility-hub-blueprint.md`
untuk arah produk, dan `docs/PRD.md` untuk spesifikasi MVP.

## Tools (MVP)

| Tool | Kategori | Yang dilakukan |
|---|---|---|
| [Case Converter](#/tools/case-converter) | Text | 9 gaya penulisan sekaligus, dengan aturan akronim yang eksplisit |
| [JSON Formatter](#/tools/json-formatter) | Formatter | Format, minify, validasi + error berposisi (baris/kolom) |
| [XML Formatter](#/tools/xml-formatter) | Formatter | Format/minify dengan komentar & processing instruction dipertahankan |
| [Text Diff](#/tools/text-diff) | Diff | Diff baris + highlight karakter, opsi ignore case/whitespace |
| [JSON Diff](#/tools/json-diff) | Diff | Diff struktural per JSON Pointer + JSON Patch deskriptif |

## Menjalankan

Butuh Node.js 20.19+ atau 22.12+.

```bash
npm ci
npm run dev            # http://localhost:5173
```

Build dan verifikasi penuh (dipakai CI):

```bash
npm run build          # dist/ + 404.html + .nojekyll
npm run verify         # lint → typecheck → test → build → boundaries → bundle → kontras → preview
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
├── lib/            engine murni: text, json, xml, diff, browser
├── registry/       tools.ts — satu-satunya sumber metadata tool
├── hooks/          useDebouncedValue, useCopy, useHashRoute, useTheme, …
├── styles/         tokens.css (design tokens), base.css
└── test/           setup, helper render, audit privasi, audit aksesibilitas
```

Aturan ketergantungan yang **ditegakkan skrip** (`npm run check:boundaries`):
engine di `src/lib/{text,json,xml,diff}` tidak boleh mengimpor React atau menyentuh
`window`/`document`. Itu sebabnya engine menerima `DOMParser` sebagai parameter.

## Privasi

- Isi input tidak dikirim ke server: CSP build menetapkan `connect-src 'none'`.
- Isi input tidak disimpan: tidak ada di `localStorage`, URL, atau riwayat.
- Yang disimpan hanya preferensi tampilan (`duh:v1:theme`, indent, opsi diff).
  Daftar lengkap ada di halaman `#/privacy` dan berasal dari satu konstanta di kode.
- Audit ini otomatis: `src/test/privacy.test.tsx`.

## Keputusan teknis

Lihat `docs/adr/` — aturan case conversion, semantik JSON Diff, kebijakan fidelity
XML, status XML↔JSON, batas ukuran input, dan pilihan stack/versi.

## Kontribusi

Baca `CONTRIBUTING.md`. Semua perubahan perilaku harus dapat ditelusuri ke
`docs/PRD.md` atau ADR; dependency baru butuh alasan tertulis.

## Lisensi

MIT — lihat [LICENSE](LICENSE).
