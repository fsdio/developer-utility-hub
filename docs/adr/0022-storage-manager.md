# ADR-0022 — Halaman "Kelola penyimpanan"

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** permintaan "tambahkan menu manage storage untuk clean cache atau
  data yang disimpan di browser untuk website ini"
- **Terkait:** ADR-0013 (offline mode & `version.json`), ADR-0017 (tool berkas),
  PRD §3 (privasi)

## Konteks

Situs ini menyimpan beberapa hal di peramban: tujuh kunci preferensi di
`localStorage`, satu kunci penjaga reload di `sessionStorage`, dan Cache Storage
dari service worker (± 30 aset build). Sebelumnya satu-satunya cara menghapusnya
adalah menu "hapus data situs" di peramban — kasar, tidak selektif, dan tidak
menjelaskan apa yang hilang. Halaman Privasi hanya mendaftar lima dari tujuh
kunci preferensi, jadi daftarnya pun tidak akurat.

## Keputusan

### 1. Halaman khusus `#/storage` — "Kelola penyimpanan"

Tautan ada di footer, di samping Privasi. Halaman ini adalah **satu-satunya
tempat** untuk melihat dan menghapus data situs, dan hanya memuat tiga blok:

1. **Ringkasan** — jumlah kunci preferensi + byte, jumlah cache + entri,
   perkiraan pemakaian & kuota (`navigator.storage.estimate`), tombol
   "Muat ulang laporan".
2. **Data yang disimpan** — daftar baris: nama manusia, ukuran, cuplikan nilai.
   Hanya kunci berawalan `duh:`; kunci situs lain di origin yang sama hanya
   **dihitung**, tidak ditampilkan isinya dan tidak pernah dihapus.
3. **Bersihkan** — tiga tindakan terpisah: hapus preferensi, hapus cache
   offline, lepas service worker. Masing-masing memberi pesan hasil.

### 2. Namespace `duh:` sebagai batas kepemilikan

Semua kunci aplikasi berawalan `duh:`. Penghapusan memakai filter itu, bukan
`localStorage.clear()`, sehingga aplikasi yang kebetulan berbagi origin tidak
kehilangan datanya. Daftar kunci dan labelnya diambil dari satu sumber
(`APP_STORAGE_KEYS`, `PREFERENCE_LABELS`) yang dipakai bersama halaman Privasi —
daftar tidak bisa lagi berbeda antarhalaman.

### 3. Lapisan browser, bukan engine

`src/lib/browser/storage-report.ts` berisi `collectStorageReport()`,
`clearAppPreferences()`, `clearCacheStorage()`, dan `unregisterServiceWorker()`.
Modul ini boleh menyentuh `window`/`navigator`/`caches` (bukan engine murni),
tetapi **tidak memakai `fetch`**: laporan disusun dari API browser yang sudah ada.
Snapshot storage diambil lewat `Storage.key(i)`, dan `localStorage` yang diblokir
peramban (mode privat) dilaporkan sebagai `supported: false` — halaman tidak
crash.

### 4. Tidak menyentuh isi dokumen

Halaman ini tidak bisa menghapus isi input karena isi input memang tidak pernah
disimpan (PRD §3). Yang dihapus hanya preferensi tampilan, cache aset, dan
pendaftaran service worker. Teks ini ditampilkan di halaman supaya tidak ada
kesan bahwa "hapus data" menghapus pekerjaan pengguna.

### 5. Ukuran dalam byte UTF-8

`utf8Bytes()` memakai `TextEncoder`, bukan `String.length`, supaya angka yang
tampil jujur untuk nilai non-ASCII (mis. opsi diff atau nama tema).

## Konsekuensi

- Rute baru `#/storage` (+ `toHash`, judul dokumen, uji router & a11y).
- Halaman Privasi kini mendaftar **semua** kunci preferensi (termasuk riwayat
  tool dan ID build) dan menjelaskan Cache Storage, dengan tautan ke halaman
  Kelola penyimpanan.
- Penghapusan preferensi mengembalikan tema dan opsi ke bawaan; menghapus cache
  membuat build berikutnya diunduh ulang; melepas service worker mematikan mode
  offline sampai halaman dimuat ulang — semuanya disebut di UI.
- Uji: `src/lib/browser/storage-report.test.ts` (13 test) dan
  `src/features/storage/StoragePage.test.tsx` (6 test), termasuk asersi bahwa
  laporan tidak memanggil `fetch` dan tidak menyentuh kunci situs lain.

## Alternatif yang ditolak

| Alternatif | Alasan ditolak |
|---|---|
| `localStorage.clear()` | Menghapus data situs lain di origin yang sama dan tidak selektif |
| Tombol "hapus semua" tunggal | Pengguna tidak bisa mempertahankan preferensi sambil membersihkan cache (kasus paling sering saat versi lama tersangkut) |
| Panel di halaman Privasi | Privasi adalah penjelasan kebijakan; tindakan destruktif lebih jelas di halaman sendiri dengan konfirmasi hasil |
| Menyimpan preferensi di cookie | Bertentangan dengan janji "tidak ada cookie" di halaman Privasi |
| Menghapus otomatis saat versi berubah | Menghapus pilihan pengguna tanpa izin; `version.json` sudah menangani pembaruan aset |
