# ADR-0002 — Semantik dan format keluaran JSON Diff

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §3.3 ("Hal yang harus ditentukan" untuk JSON Diff) dan §14 no. 3.

## Konteks

Blueprint merekomendasikan "urutan key diabaikan" dan "urutan array bermakna", tetapi
tidak menetapkan (a) format keluaran, (b) cara merepresentasikan path, (c) perlakuan
perubahan tipe. Selain itu tabel stack §6 menyebut library `diff` di baris "Diff",
padahal `diff` bekerja pada **teks**, bukan struktur JSON. Mengikuti blueprint secara
mentah akan menghasilkan implementasi yang membandingkan string.

## Keputusan

### 1. Perbandingan struktural, bukan tekstual

Input di-`JSON.parse` lebih dulu. Bila salah satu gagal parse → tidak ada diff,
hanya error terstruktur per panel (baris/kolom). String yang berbeda tetapi
setara secara struktur (mis. beda indentasi) menghasilkan **nol** perubahan.

### 2. Aturan semantik

| Aturan | Nilai |
|---|---|
| Urutan key object | diabaikan (selalu) |
| Urutan elemen array | bermakna, index-based |
| Perubahan tipe pada path sama | `changed` + penanda `tipe: string → number` |
| Key hilang / muncul | `removed` / `added` |
| Nilai `null` vs key hilang | dua hal berbeda: `null` adalah nilai, key hilang adalah `removed`/`added` |
| Angka | dibandingkan dengan `===`; `1` dan `1.0` sama, `1` dan `"1"` berbeda tipe |
| `ignoreArrayOrder` | ditunda ke backlog (bukan MVP) |

### 3. Path memakai JSON Pointer (RFC 6901)

`/users/0/name`, key dengan `/` atau `~` di-escape (`~0`, `~1`). Root adalah `""`
dan ditampilkan sebagai `(root)`.

### 4. Keluaran: dua tampilan, satu model data

Model internal:

```ts
type ChangeKind = "added" | "removed" | "changed";
type JsonChange = {
  path: string;          // JSON Pointer
  kind: ChangeKind;
  before?: unknown;      // undefined untuk "added"
  after?: unknown;       // undefined untuk "removed"
  typeChange?: { from: string; to: string };
};
```

- **Tampilan Path** (default): tabel `path · jenis · nilai lama → nilai baru`.
- **Tampilan Patch**: JSON Patch (RFC 6902) yang dihasilkan dari model di atas,
  memakai `add` / `remove` / `replace` saja. Patch diberi label **deskriptif**:
  tidak dijamin apply-able secara round-trip untuk dokumen dengan key order berbeda,
  karena `add` pada object bersifat posisional dalam RFC 6902.

### 5. Determinisme urutan

Perubahan diurutkan: (1) kedalaman path, (2) urutan leksikografis path, (3) jenis.
Ini membuat output stabil untuk input yang sama.

### 6. Batas

Kedalaman maksimum 200 (mencegah stack overflow pada dokumen jahat/aneh);
melampaui → error yang menjelaskan batas. Ukuran input mengikuti ADR-0005.

## Konsekuensi

- Positif: satu model data untuk dua tampilan, mudah diuji, tanpa dependency diff struktural.
- Negatif: tidak ada tampilan berdampingan (side-by-side tree) di MVP; ditunda.
- Biaya: kita menulis sendiri ~150 baris rekursi; tidak memakai `json-diff` pihak ketiga
  agar keluaran (path + patch) sepenuhnya di bawah kendali kita.

## Alternatif yang ditolak

- **Memakai library `diff` (baris kolom stack §6)**: membandingkan teks, bukan struktur.
  Sudah dikoreksi di dokumen technical design; library tetap dipakai untuk Text Diff.
- **`json-diff` npm**: keluaran konsol-oriented, tidak menyediakan JSON Pointer, dan
  menambah dependency yang sulit dikustomisasi.
- **Hanya menampilkan patch tanpa tabel path**: kurang ramah untuk pengguna yang ingin
  melihat perubahan tanpa membaca notasi RFC.
- **Array sebagai multiset (urutan diabaikan)**: menyembunyikan perubahan nyata; ditolak
  untuk MVP.
