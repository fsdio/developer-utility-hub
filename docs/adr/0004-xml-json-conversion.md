# ADR-0004 — XML ↔ JSON conversion ditunda ke backlog

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §14 no. 4 ("Apakah XML/JSON conversion masuk MVP atau backlog?").

## Konteks

Blueprint §3.2 mencantumkan JSON→XML dan XML→JSON sebagai "kandidat konversi" dengan
catatan bahwa konversi tersebut harus menjadi fitur terpisah **dengan dokumentasi
aturan pemetaan dan keterbatasan**. Blueprint juga sudah menyatakan bahwa konversi
tidak lossless (attribute, namespace, mixed content, elemen berulang).

## Keputusan

**Tidak masuk MVP.** Masuk backlog Phase 5 sebagai dua tool terpisah
(`json-to-xml`, `xml-to-json`), bukan tombol di dalam formatter.

Bila diimplementasikan kelak, aturan minimum yang harus ditetapkan lebih dulu:

1. Pemetaan atribut (prefix `@`, konflik dengan key biasa).
2. Pemetaan text node campuran (`#text`, atau tolak mixed content).
3. Representasi elemen berulang (array vs objek tunggal — harus deterministik).
4. Namespace (prefix dipertahankan? URI sebagai key?).
5. Apa yang terjadi pada komentar dan PI (dibuang, dengan peringatan).
6. Nama root dan deklarasi XML pada output.

## Alasan

- Setiap tool MVP sudah memiliki pekerjaan validasi + test yang belum selesai.
  Menambah konversi akan menggeser fokus dari kualitas ke kuantitas, bertentangan
  dengan prinsip blueprint §4 ("lima tools yang matang lebih bernilai").
- Konversi XML→JSON tanpa aturan pemetaan eksplisit adalah sumber bug yang tidak
  dapat dipertanggungjawabkan; itu butuh dokumen setara ADR-0003, bukan tombol.

## Konsekuensi

- Halaman formatter tidak menampilkan tombol konversi (tidak ada UI setengah jadi).
- Backlog mencatat item ini beserta daftar pertanyaan di atas, agar tidak dikerjakan
  setengah matang oleh kontributor.
