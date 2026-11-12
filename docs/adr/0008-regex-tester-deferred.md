# ADR-0008 — Regex Tester ditunda (mitigasi ReDoS belum memadai)

- **Status:** Accepted (menunda implementasi)
- **Tanggal:** 2026-11-12
- **Menutup:** backlog Phase 5 baris "Regex tester — butuh mitigasi ReDoS"; blueprint §7 risiko "Regex berbahaya/mahal".

## Konteks

Blueprint §3.4 dan §7 menyebut Regex Tester sebagai kandidat, sekaligus mencatat
risiko: "regex tester perlu menangani pola invalid dan potensi input/pola yang
menyebabkan pemrosesan terlalu lama". Backlog menambahkan syarat: "ADR terpisah:
timeout/isolasi".

Masalah teknisnya: JavaScript tidak punya cara menghentikan eksekusi
`RegExp.prototype.exec` yang sedang berjalan. `setTimeout` tidak membantu karena
regex berjalan sinkron di main thread; ketika regex catastrophic backtracking
mulai, halaman **sudah** membeku sebelum timeout apa pun dievaluasi.

## Keputusan

**Ditunda.** Bukan diimplementasikan pada Phase 5, dan tidak akan diimplementasikan
sebelum salah satu prasyarat berikut terpenuhi:

1. **Web Worker + terminasi**: regex dijalankan di Worker terpisah; bila melewati
   batas waktu (mis. 500 ms) Worker di-`terminate()`. Ini mitigasi nyata karena
   terminasi Worker menghentikan thread tersebut.
2. **Batas ukuran input dan pola** yang cukup kecil sehingga eksploitasi tidak
   berdampak, **plus** peringatan eksplisit di UI bahwa tool dapat membekukan tab.
3. **Mesin regex alternatif** (mis. regex engine tanpa backtracking) — belum ada
   pilihan mapan di ekosistem browser untuk itu.

Prasyarat #1 adalah jalur yang dipilih bila tool ini dikerjakan. Itu memerlukan:
engine regex yang terisolasi, protokol pesan Worker, fallback bila Worker tidak
tersedia, dan test yang benar-benar membuktikan terminasi bekerja — pekerjaan
tersendiri, bukan tambahan kecil pada Phase 5.

## Alasan menolak "implementasi cepat"

Menambahkan Regex Tester dengan `setTimeout` di sekitar `exec` akan **tampak**
aman tetapi tidak menghentikan apa pun. Itu lebih buruk daripada tidak ada tool:
pengguna mengira sudah terlindungi, lalu tab mereka tetap membeku. Keputusan
produk harus jujur soal batas (PRD §3), jadi menolak implementasi setengah aman
adalah konsekuensi langsung dari prinsip itu.

## Konsekuensi

- Kategori `utilities` tetap tanpa Regex Tester; tidak ada entri `planned` yang
  menggantung di registry.
- Backlog mencatat prasyarat di atas agar kontributor tidak mengerjakan versi
  yang tidak aman.
- Bila dikerjakan kelak: wajib ADR baru yang mencatat mekanisme terminasi dan
  bukti test-nya.
