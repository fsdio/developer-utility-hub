# ADR-0016 — Pindah ke custom domain: base path jadi satu env var

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Konteks:** situs dipasang di `https://developerutilityhub.web.id/`

## Masalah

Base path dulu di-hardcode `/developer-utility-hub/` di tiga tempat:
`vite.config.ts`, `scripts/postbuild.mjs` (skrip redirect 404), dan
`scripts/preview-check.mjs` (smoke test). Begitu situs pindah ke custom domain
yang disajikan dari **root**, build masih merujuk
`/developer-utility-hub/assets/index-*.js`. Di `fsdio.github.io` path itu masih
ada (project page), jadi kerusakannya tidak terlihat sampai domain dipakai:
di `developerutilityhub.web.id` semua aset 404 → halaman kosong.

Selain itu ada bug laten yang ikut terungkap: CSP memakai `connect-src 'none'`,
padahal ADR-0013 butuh `fetch("version.json")`. Cek versi akan selalu diblokir
browser, sehingga build baru tidak pernah terdeteksi.

## Keputusan

### 1. Satu sumber base path

`scripts/site-base.mjs`:

```js
export function siteBase() {
  const raw = process.env.VITE_BASE_PATH ?? "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}
```

Dipakai oleh `vite.config.ts` (`base`), `scripts/postbuild.mjs` (skrip 404), dan
`scripts/preview-check.mjs` (server + pemeriksaan aset). **Default `/`** karena
domain produksi sekarang di root; project page tinggal set
`VITE_BASE_PATH=/developer-utility-hub/`.

### 2. `public/CNAME`

Berkas `CNAME` berisi `developerutilityhub.web.id` ikut ke `dist/`, sehingga
deploy berikutnya tidak menghapus pengaturan domain kustom di GitHub Pages.
(Ketika domain diatur lewat Settings, GitHub menyimpannya di branch artefak;
`public/CNAME` membuatnya eksplisit dan bisa di-review.)

### 3. Smoke test mengikuti base build-nya

`preview-check` membaca base yang sama, tidak lagi mengasumsikan satu path:
- referensi absolut yang keluar dari base → gagal (menangkap sisa
  `/developer-utility-hub/` pada build root),
- `version.json`, `sw.js`, `manifest.webmanifest`, `404.html` wajib 200.

### 4. CSP: `connect-src 'self'`

Diganti dari `'none'` menjadi `'self'` supaya cek versi berjalan. Ini **tidak**
melonggarkan privasi: tidak ada endpoint tulis, tidak ada analytics, dan
`privacy.test.tsx` tetap memastikan tidak ada permintaan jaringan saat tool
dipakai. `preview-check` menolak CSP yang memakai wildcard atau skema `https:`
di `connect-src`.

### 5. Naikkan versi cache service worker

`CACHE` dinaikkan ke `duh-shell-v2`. Cache lama menyimpan `index.html` dengan
path aset `/developer-utility-hub/...`; tanpa kenaikan versi, pengguna lama bisa
tetap disajikan HTML basi yang menunjuk path 404.

## Konsekuensi

**Positif**

- Pindah domain cukup satu env var; tidak ada lagi path yang tersebar.
- Regression "aset 404 setelah ganti domain" tertangkap di CI, bukan di produksi.
- Offline mode akhirnya benar-benar berjalan (sebelumnya diblokir CSP).

**Negatif / dikendalikan**

- Deploy project page (`fsdio.github.io/developer-utility-hub/`) kini butuh env
  `VITE_BASE_PATH`; kalau lupa, build root akan 404 di sana. Ini disengaja:
  domain kustom adalah target utama. `preview-check` akan gagal lebih awal bila
  base dan artefak tidak cocok.
- Cache service worker harus dinaikkan manual setiap base berubah. Aturan ini
  ditulis di komentar `public/sw.js`.

## Langkah manual di GitHub (sekali saja)

1. **Settings → Pages → Custom domain** = `developerutilityhub.web.id`,
   centang **Enforce HTTPS** (sertifikat untuk `www` ikut diterbitkan).
2. **DNS** di registrar: `A` untuk apex →
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`;
   `CNAME` untuk `www` → `fsdio.github.io`.
3. Deploy ulang (`main`) agar artefak baru — dengan base `/` dan `CNAME` — aktif.
   Sampai itu terjadi, `developerutilityhub.web.id` masih menyajikan build lama
   yang menunjuk `/developer-utility-hub/`, sehingga halaman tampak kosong.

## Alternatif yang ditolak

- **Mempertahankan base `/developer-utility-hub/` di custom domain** — bisa
  berjalan, tetapi URL publik jadi `developerutilityhub.web.id/developer-utility-hub/`
  dan `favicon`/manifest/PWA scope ikut terasa janggal. Ditolak.
- **Redirect HTML di `index.html` root** — menambah satu lompatan dan tetap
  menyisakan aset di subpath. Ditolak.
- **`connect-src 'none'` + menyuntikkan versi saat build ke HTML** — menghapus
  kemampuan mendeteksi build baru tanpa deploy ulang klien. Ditolak.
