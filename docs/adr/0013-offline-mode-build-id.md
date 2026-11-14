# ADR-0013 — Offline mode dengan ID build sebagai penentu

- **Status:** Diterima
- **Tanggal:** 2026-11-12
- **Konteks:** permintaan "klien tidak perlu terus mengambil ke server"

## Masalah

Aplikasi ini statis dan seluruh tool berjalan di browser, tetapi setiap kunjungan
tetap memuat HTML + chunk dari server. Dua akibat:

1. **Borosan**: aset yang tidak berubah diunduh ulang.
2. **Tidak bisa dipakai offline** walau tidak ada satu pun fitur yang butuh server.

Yang dibutuhkan bukan sekadar cache, melainkan cara menentukan **kapan cache
boleh dipakai** dan **kapan harus ambil versi baru** — tanpa membuat pengguna
terjebak di versi lama setelah deploy.

## Keputusan

### 1. ID build di `version.json`

`scripts/postbuild.mjs` menulis `dist/version.json`:

```json
{ "id": "970ae28aa7460998", "builtAt": "2026-11-14T08:56:19.771Z" }
```

`id` adalah sha256 dari `index.html` (16 heksadesimal pertama). `index.html`
memuat nama chunk ber-hash, jadi **isi build berubah → nama chunk berubah → id
berubah**. Tidak perlu menghitung ulang semua berkas.

### 2. Service worker: cache-first untuk aset, network-first untuk HTML

`public/sw.js`:

| Jenis permintaan | Strategi | Alasan |
|---|---|---|
| `assets/*` (ber-hash) | cache-first, simpan selamanya | nama berkas = versi, tidak mungkin basi |
| HTML/navigasi | network-first, fallback cache | halaman selalu terbaru bila online |
| `version.json` | **selalu jaringan**, tidak di-cache | satu-satunya sumber kebenaran versi |

`version.json` sengaja tidak pernah masuk cache. Kalau ikut di-cache, klien akan
membandingkan versi lama dengan versi lama dan tidak pernah tahu ada build baru.

### 3. Alur keputusan di klien

`registerOfflineMode()` dipanggil **setelah paint pertama** (tidak menunda
interaksi) dan hanya pada build produksi:

1. Daftarkan service worker, tunggu sampai `activated`.
2. `fetch("version.json", { cache: "no-store" })`.
3. Bandingkan dengan `duh:v1:build-version` di localStorage.

| Kondisi | Keputusan | Efek |
|---|---|---|
| id sama | `up-to-date` | pakai cache browser, **tanpa reload** |
| id beda | `update` | simpan id baru, reload sekali |
| belum punya id | `update` | simpan id, tanpa reload (muat pertama) |
| server tak terjangkau | `unknown` | pakai cache apa adanya (offline) |

Reload dijaga flag `sessionStorage` berisi id baru, sehingga tidak mungkin terjadi
loop reload bila deploy berubah saat halaman sedang dibuka.

### 4. Biaya jaringan

- Kunjungan berikutnya: **satu** permintaan kecil (`version.json`, ~70 byte).
- Offline: **nol** permintaan; aplikasi terbuka dari cache.
- Chunk tool tetap di-`import()` dinamis, jadi tool yang tidak dibuka tidak
  pernah diunduh walau sudah di-cache.

## Konsekuensi

**Positif**

- Sekali dibuka, aplikasi bisa dipakai tanpa jaringan.
- Setelah deploy, pengguna otomatis mendapat versi baru pada kunjungan berikutnya.
- Biaya jaringan rutin turun menjadi satu berkas kecil.

**Negatif / dikendalikan**

- Service worker menambah kompleksitas: cache harus dibersihkan saat nama cache
  berubah. Versi cache ditulis di kode (`duh-shell-v1`); saat strategi berubah,
  nilai ini **wajib** dinaikkan.
- Pengguna yang membuka dua tab bersamaan bisa melihat satu tab reload lebih dulu.
  Diterima: guard sesi mencegah loop, dan data pengguna tidak disimpan.
- Tidak ada UI "versi baru tersedia" — reload otomatis dipilih agar tidak menambah
  satu klik. Bila nanti dibutuhkan, `decision` sudah tersedia untuk ditampilkan.

## Alternatif yang ditolak

- **Cache-first untuk HTML** — pengguna bisa terjebak selamanya di versi lama.
  Ditolak.
- **Membandingkan `ETag`/`Last-Modified`** — bergantung pada header server dan
  berbeda antar-host (GitHub Pages vs host lain). ID eksplisit lebih deterministik.
- **Workbox / plugin PWA** — menambah dependensi dan lapisan abstraksi untuk
  kebutuhan yang bisa ditulis dalam ~80 baris. Ditolak.
