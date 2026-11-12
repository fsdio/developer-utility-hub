# ADR-0003 — Kebijakan fidelity XML Formatter

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §3.2 (catatan XML) dan §7 (risiko "XML parser error").

## Konteks

Blueprint hanya memperingatkan bahwa konversi XML ↔ JSON tidak lossless, tetapi
**tidak** menyebut bahwa format/minify XML itu sendiri juga lossy bila kita memakai
`XMLSerializer` setelah `DOMParser`. Yang hilang atau berubah dengan pendekatan naif:

- Komentar `<!-- ... -->` (hilang pada sebagian jalur serialisasi).
- Processing instruction `<?xml-stylesheet ...?>` dan deklarasi `<?xml version?>`.
- CDATA `<![CDATA[...]]>` yang berubah menjadi text ter-escape.
- Entity kustom (`<!ENTITY foo "bar">`) yang tidak dikenal `DOMParser` → parse error.
- Whitespace signifikan di dalam elemen berisi text.
- Atribut yang urutannya berubah (tidak fatal, tetapi mengganggu diff).
- Self-closing tag `<a/>` vs `<a></a>`.

## Keputusan

### 1. Parser: `DOMParser` dengan `application/xml`

Deteksi error harus memeriksa **dua hal**: elemen `<parsererror>` di namespace
`http://www.mozilla.org/newlayout/xml/parsererror.xml` dan elemen bernama
`parsererror` tanpa namespace (perilaku Chromium). Teks error diambil sebagai
**textContent**, tidak pernah di-`innerHTML`-kan.

### 2. Serializer sendiri, bukan `XMLSerializer`

Kita menulis walker rekursif atas DOM hasil parse yang mempertahankan secara eksplisit:

| Node | Perlakuan |
|---|---|
| Document | tulis deklarasi XML hanya jika ada di input asli |
| Element | `<name attr="v" ...>` dengan atribut sesuai urutan asli |
| Text | di-escape `&`, `<`, `>`; whitespace di dalamnya dipertahankan |
| Comment | dipertahankan bila opsi `preserveComments` aktif (default: aktif) |
| ProcessingInstruction | selalu dipertahankan |
| CDATA | diserialisasi sebagai text ter-escape (perilaku eksplisit, didokumentasikan) |

### 3. Whitespace

- **Format**: text node yang seluruhnya whitespace dan berada di antara elemen
  **dibuang** (indentasi lama), lalu indentasi baru dibuat.
- **Minify**: hanya whitespace antar-elemen yang dibuang; whitespace di dalam text
  node yang berisi karakter non-whitespace **dipertahankan**.
- **Elemen mixed content** (text + elemen bercampur) **tidak** diindentasi ulang isinya;
  kita hanya mengindentasi anak-anak elemen, dan membiarkan text-nya apa adanya.
  Ini mencegah perubahan makna pada `<p>Halo <b>dunia</b>!</p>`.

### 4. Yang secara eksplisit TIDAK dijamin (harus tampil di UI)

- Round-trip byte-identik.
- Dukungan DTD/entity kustom (akan dilaporkan sebagai error parse, bukan crash).
- Preservasi CDATA sebagai CDATA.
- Preservasi urutan namespace declaration yang eksotis.

UI menampilkan catatan: *"Formatter ini merapikan struktur, bukan penjamin round-trip.
Komentar dipertahankan bila opsi aktif; CDATA ditulis ulang sebagai teks ter-escape."*

### 5. Validasi

Parse sukses = valid secara well-formed. **Bukan** validasi terhadap DTD/XSD.
Label tombol adalah "Validasi struktur (well-formed)", bukan "Validasi XML".

## Konsekuensi

- Positif: komentar dan PI tidak hilang diam-diam; ekspektasi pengguna cocok dengan perilaku.
- Negatif: kita memelihara serializer sendiri (~120 baris) dan harus menguji tiap jenis node.
- Wajib: unit test untuk komentar, PI, CDATA, entity kustom, mixed content, dan namespace.

## Alternatif yang ditolak

- **`XMLSerializer` bawaan**: perilaku berbeda antar browser dan tidak stabil untuk
  komentar/self-closing; hasilnya tidak dapat diuji lintas browser.
- **Library `xml-formatter` npm**: cepat, tetapi tidak dapat mengonfigurasi
  preservasi komentar + mixed content sesuai kebutuhan, dan menambah dependency
  untuk pekerjaan yang bisa ditulis eksplisit.
- **Klaim "lossless"**: tidak jujur; ditolak.
