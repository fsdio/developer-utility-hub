# Product Blueprint --- Developer Utility Hub

> Dokumen kebutuhan dan strategi awal berdasarkan diskusi. Dokumen ini
> menjadi sumber acuan sebelum desain UI dan implementasi dimulai.
>
> **Status:** Draft --- siap diturunkan menjadi PRD dan backlog
> implementasi\
> **Target hosting:** GitHub Pages\
> **Pendekatan:** Browser-first, modular, open-source oriented,
> compact-medium UI

------------------------------------------------------------------------

## 1. Ringkasan Produk

Produk yang akan dibangun adalah **satu website yang menyediakan banyak
utility/helper**, terutama untuk kebutuhan developer sehari-hari. Setiap
utility memiliki fungsi yang jelas dan dapat dikembangkan secara
independen, tetapi semuanya berada dalam satu product dan memiliki
pengalaman penggunaan yang konsisten.

Produk ini bukan: - SaaS dengan akun pengguna dan dashboard
administrasi. - Website portofolio. - Sekadar kumpulan link menuju tools
pihak lain. - Aplikasi yang membutuhkan backend untuk menjalankan fitur
inti.

Produk ini adalah **Developer Utility Hub**: kumpulan tools praktis yang
dapat langsung digunakan dari browser, dengan kemungkinan kontribusi
komunitas open-source.

### Tujuan utama

1.  Menyediakan utility developer dalam satu tempat.
2.  Mengurangi kebutuhan membuka banyak website atau membuat script
    sementara untuk pekerjaan kecil.
3.  Membuat setiap utility mudah ditemukan dan digunakan.
4.  Memungkinkan penambahan utility baru tanpa merombak aplikasi.
5.  Menyediakan jalur bagi pengguna untuk mengusulkan fitur dan
    melaporkan bug.
6.  Mempublikasikan aplikasi secara gratis melalui GitHub Pages selama
    kebutuhan tetap cocok dengan static hosting.

### Prinsip produk

-   **Useful first:** fungsi lebih penting daripada dekorasi.
-   **Compact, not empty:** tampilan ringkas tetapi tetap memiliki
    identitas dan informasi yang cukup.
-   **Open-source oriented:** struktur repository, dokumentasi, issue,
    dan kontribusi dibuat jelas.
-   **Browser-first:** proses utility inti dilakukan di browser
    pengguna.
-   **Modular:** utility independen secara implementasi.
-   **Incremental:** mulai dari MVP kecil, kemudian berkembang
    berdasarkan kebutuhan nyata.

------------------------------------------------------------------------

## 2. Target Pengguna dan Value Proposition

### Target awal

-   Backend developer.
-   Frontend developer.
-   Fullstack developer.
-   Software engineer yang sering melakukan debugging atau inspeksi
    data.
-   QA engineer yang perlu membandingkan payload, response, atau teks.

### Value proposition

Pengguna dapat melakukan pekerjaan kecil yang berulang---seperti
mengubah format teks, merapikan JSON/XML, dan membandingkan dua
teks---secara cepat dari satu website.

Contoh: - Mengubah `hello world` menjadi `helloWorld`. - Memformat atau
memvalidasi JSON. - Merapikan XML. - Membandingkan dua response API. -
Menghapus baris kosong atau duplikat. - Mengodekan atau mendekodekan
Base64 dan URL.

------------------------------------------------------------------------

## 3. Katalog Fitur

Katalog berikut adalah inventaris kebutuhan dan kandidat fitur. Tidak
berarti semuanya harus masuk rilis pertama.

### 3.1 Text Utilities

#### Case Converter

Konversi teks ke beberapa gaya:

-   UPPERCASE
-   lowercase
-   Title Case
-   Sentence case
-   camelCase
-   PascalCase
-   snake_case
-   kebab-case
-   CONSTANT_CASE

**Catatan implementasi:** jangan hanya mengandalkan `toUpperCase()` dan
`toLowerCase()`. Case converter perlu melakukan tokenization yang
memperhatikan: - Spasi dan separator (`_`, `-`, dan tanda baca). -
Peralihan huruf kecil ke huruf kapital. - Singkatan seperti `HTTP` atau
`ID`. - Kombinasi huruf dan angka.

Contoh kasus uji: - `hello world` → `helloWorld` - `userID` →
`user_id` - `HTTPResponse` → `http_response`

Perlu ditetapkan perilaku untuk tanda baca, Unicode, angka, dan
singkatan sebelum implementasi final.

#### Text Cleaner dan Text Manipulation

Kandidat fitur: - Trim whitespace. - Menghapus baris kosong. - Menghapus
baris duplikat. - Mengurutkan baris. - Membalik teks. - Menghitung
karakter, kata, dan baris.

### 3.2 Data Utilities

#### JSON Formatter

Fungsi yang diperlukan: - Format/beautify JSON. - Minify JSON. -
Validasi JSON. - Konfigurasi indent (misalnya 2 atau 4 spasi). -
Menampilkan pesan error yang jelas. - Copy hasil. - Clear/reset input. -
Download hasil jika relevan.

Kandidat pengembangan: - JSON Tree Viewer. - JSON Diff.

**Catatan:** `JSON.parse` dan `JSON.stringify` dapat menjadi dasar
formatter, tetapi pesan error perlu dibuat mudah dipahami. Pertimbangkan
keterbatasan pesan parser bawaan browser dalam menunjukkan lokasi error
secara konsisten.

#### XML Formatter

Fungsi yang diperlukan: - Format/beautify XML. - Minify XML. - Validasi
struktur XML. - Menampilkan parser error. - Copy hasil. - Clear/reset
input. - Download hasil jika relevan.

**Catatan:** gunakan parser XML browser dan periksa kondisi parser
error. Jangan menganggap konversi XML ↔ JSON selalu lossless karena XML
memiliki konsep seperti attribute, namespace, mixed content, dan elemen
berulang.

#### Kandidat konversi

-   JSON to XML.
-   XML to JSON.

Konversi ini sebaiknya menjadi fitur terpisah dengan dokumentasi aturan
pemetaan dan keterbatasan, bukan sekadar tombol konversi tanpa
penjelasan.

### 3.3 Comparison / Diff Utilities

#### Text Diff

Fitur inti: 1. Input Original (kiri). 2. Input Modified (kanan). 3.
Highlight baris yang ditambah, dihapus, atau berubah. 4. Highlight
karakter yang berubah bila didukung dengan baik. 5. Ringkasan Added /
Removed / Modified. 6. Sinkronisasi scroll. 7. Opsi ignore whitespace.
8. Opsi ignore case. 9. Swap input. 10. Copy atau download hasil diff.

#### JSON Diff

Perbandingan berbasis struktur JSON, bukan sekadar membandingkan string
mentah.

Hal yang harus ditentukan: - Apakah urutan key object diabaikan?
Rekomendasi: ya. - Apakah urutan array dianggap bermakna? Rekomendasi
awal: ya. - Bagaimana menampilkan path properti yang berubah? -
Bagaimana membedakan added, removed, dan modified? - Bagaimana menangani
JSON invalid?

#### XML Diff

Kandidat pengembangan berikutnya. Perlu diputuskan apakah perbandingan
dilakukan secara tekstual atau berdasarkan struktur XML. Jangan
mencampur kedua pendekatan tanpa memberi pilihan yang jelas.

#### File Comparison

Kandidat lanjutan jika ada kebutuhan nyata dan ukuran file dapat
ditangani dengan baik di browser.

### 3.4 Developer Utilities

Kandidat ekspansi: - Base64 Encoder / Decoder. - URL Encoder /
Decoder. - HTML Entity Encoder / Decoder. - UUID Generator. - SHA-256 /
SHA-512 Hash Generator. - Unix Timestamp Converter. - Regex Tester. -
Cron Expression Parser. - SQL Formatter. - Color Converter (HEX / RGB /
HSL). - Number Converter (Binary / Decimal / Hex). - JWT Decoder.

**Catatan keamanan dan ketepatan:** - JWT Decoder hanya mendekode
header/payload; itu bukan verifikasi signature atau validasi token. -
Hash bukan enkripsi dan tidak dapat dibalik. - Encoding bukan
enkripsi. - UUID generator sebaiknya menggunakan `crypto.randomUUID()`
jika tersedia, dengan fallback yang aman dan terdokumentasi bila
diperlukan. - Web Crypto API dapat digunakan untuk hashing. - Regex
tester perlu menangani pola invalid dan potensi input/pola yang
menyebabkan pemrosesan terlalu lama.

------------------------------------------------------------------------

## 4. Prioritas dan MVP

Jangan mengimplementasikan seluruh katalog sekaligus. MVP yang
disarankan berisi lima utility:

  Prioritas   Utility          Alasan
  ----------- ---------------- -----------------------------------------------------
  P0          Case Converter   Mudah dipahami dan cepat memberi manfaat
  P0          JSON Formatter   Kebutuhan umum developer
  P0          XML Formatter    Melengkapi kebutuhan format data
  P0          Text Diff        Berguna untuk debugging dan membandingkan teks
  P0          JSON Diff        Menambah kemampuan perbandingan yang lebih bermakna

Fitur seperti Base64, URL Encoder, UUID, SQL Formatter, Regex Tester,
dan lainnya masuk backlog ekspansi.

### Kriteria pemilihan fitur berikutnya

Evaluasi berdasarkan: 1. Frekuensi kebutuhan. 2. Manfaat nyata bagi
target pengguna. 3. Kompleksitas implementasi. 4. Risiko keamanan dan
privasi. 5. Kualitas library atau API yang tersedia. 6. Biaya
pemeliharaan dan testing.

Jangan mengejar jumlah fitur. Lima tools yang matang lebih bernilai
daripada puluhan tools yang setengah berfungsi.

------------------------------------------------------------------------

## 5. Product Experience dan UX

### Prinsip visual

Arah visual yang disepakati dari diskusi: - Compact-medium: ringkas
tetapi tidak terlalu sederhana atau kosong. - Nuansa open-source
developer tooling. - Memiliki identitas dan struktur informasi yang
jelas. - Tidak terasa seperti dashboard SaaS perusahaan. - Tidak penuh
elemen dekoratif atau printilan yang tidak dibutuhkan. - Dark dan Light
theme dapat disediakan. - Animasi minimal. - Responsif untuk desktop dan
mobile.

Referensi karakter, bukan untuk ditiru mentah-mentah: - GitHub: struktur
repository, dokumentasi, dan komunitas. - VS Code: workspace dan pola
interaksi developer. - Raycast: pencarian dan command palette. - Linear:
visual hierarchy dan konsistensi spacing.

### Hindari

-   Dashboard statistik yang tidak mendukung pekerjaan inti.
-   Login/registrasi untuk MVP.
-   Kartu dekoratif berlebihan.
-   Notifikasi yang tidak diperlukan.
-   Onboarding panjang.
-   Animasi/transisi berlebihan.
-   Menyimpan input pengguna tanpa kebutuhan dan persetujuan.
-   Menambahkan backend hanya untuk menyimpan preferensi sederhana.

### Navigasi dan workspace

Struktur yang disarankan: - Header: nama/logo product, pencarian tools,
GitHub repository, theme switcher. - Navigasi kategori: Text, Formatter,
Diff, Encoder/Utilities, dan Community. - Workspace: area kerja spesifik
sesuai utility.

Pilihan layout final masih perlu dikunci: - **Opsi A --- Utility
independen:** setiap tool memiliki halaman/workspace sendiri, dengan
shared UI dan shared engine. - **Opsi B --- Workspace terpadu:** semua
tools berada dalam satu workspace terpadu.

**Rekomendasi sementara: Opsi A.** Setiap utility independen secara
halaman dan implementasi, tetapi memakai design system dan komponen
bersama agar pengalaman konsisten.

### Perilaku umum setiap utility

Sesuai kebutuhan tool, sediakan: - Input. - Opsi/configuration yang
relevan. - Output. - Validasi dan error state. - Copy. - Clear/reset. -
Download bila masuk akal.

Jangan memaksakan komponen yang sama untuk semua tool. Text Converter
tidak memerlukan editor kompleks seperti JSON Formatter; Diff memerlukan
dua panel; JSON Formatter dapat membutuhkan syntax highlighting dan line
number.

### Search dan discovery

Pencarian tools dapat membantu pengguna menemukan utility tanpa harus
memahami kategori terlebih dahulu.

Command palette `Ctrl + K` adalah kandidat peningkatan, bukan syarat
MVP. Jika dibuat, harus ringan dan benar-benar berguna.

Favorites dan recent tools juga bukan kebutuhan MVP dan dapat ditunda.

------------------------------------------------------------------------

## 6. Arsitektur Teknis

### Stack yang direkomendasikan

  Area                Pilihan
  ------------------- -------------------------------------------------------------
  Framework           React
  Language            TypeScript
  Build tool          Vite
  Styling             CSS atau Tailwind CSS
  UI components       Komponen sendiri atau shadcn/ui secara selektif
  Icons               Lucide
  Routing             Hash-based routing atau routing dengan fallback yang benar
  State               React state; Zustand hanya jika kompleksitas membutuhkannya
  Validation          Validasi native dan/atau Zod sesuai kebutuhan
  Diff                Library diff yang sesuai, misalnya `diff`
  Unit testing        Vitest
  Component testing   React Testing Library
  E2E                 Playwright bila cakupan aplikasi sudah memadai

Jangan menambahkan dependency tanpa alasan. Ukuran bundle dan performa
merupakan bagian dari kualitas produk.

### Arsitektur berlapis

1.  **Presentation Layer**
    -   Layout.
    -   Navigation.
    -   Workspace.
    -   Reusable UI components.
2.  **Application Layer**
    -   Tool registry.
    -   Routing.
    -   Pengelolaan preferensi.
    -   Integrasi antar komponen aplikasi.
3.  **Utility Engine Layer**
    -   Text engine.
    -   JSON/XML engine.
    -   Diff engine.
    -   Encoder/generator engine.
4.  **Browser Platform**
    -   Clipboard API.
    -   File API.
    -   Web Crypto API.
    -   Local Storage untuk preferensi yang diperlukan.
    -   Web Workers jika pemrosesan berat membutuhkan pemisahan dari
        main thread.

### Tool Registry

Gunakan satu registry sebagai sumber metadata tools: - ID. - Nama. -
Deskripsi. - Kategori. - Keywords. - Route/path. - Komponen atau
lazy-loaded module.

Registry dapat digunakan oleh navigasi, pencarian, dan discovery.
Hindari menulis daftar tool yang sama berulang kali di banyak tempat.

### Struktur folder awal

``` text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── editor/
│   └── common/
├── features/
│   ├── text/
│   │   ├── case-converter/
│   │   └── text-cleaner/
│   ├── data/
│   │   ├── json-formatter/
│   │   └── xml-formatter/
│   ├── comparison/
│   │   ├── text-diff/
│   │   └── json-diff/
│   └── developer/
├── registry/
│   └── tools.ts
├── hooks/
├── lib/
├── stores/
├── types/
└── styles/
```

Setiap feature sebaiknya memiliki logic, UI, dan test sendiri. Hindari
satu file utilitas raksasa yang menampung seluruh algoritma.

------------------------------------------------------------------------

## 7. Data, Privacy, dan Security

### Browser-first

Untuk versi awal, proses utility dilakukan di browser pengguna. Ini
mengurangi kebutuhan server dan membantu menjaga input tetap lokal.

Contoh mekanisme: \| Kebutuhan \| Mekanisme \| \|---\|---\| \| Case
conversion \| JavaScript \| \| JSON parsing/formatting \| `JSON.parse` /
`JSON.stringify` \| \| XML parsing \| `DOMParser` dan API XML browser \|
\| Diff \| Pemrosesan lokal \| \| UUID \| Web Crypto API \| \|
SHA-256/SHA-512 \| Web Crypto API \| \| Preferensi tema \| Local Storage
bila diperlukan \|

### Prinsip privasi

-   Jangan mengirim isi input ke server.
-   Jangan menyimpan isi input secara otomatis.
-   Simpan hanya preferensi yang memang diperlukan.
-   Jelaskan dengan jujur data apa yang disimpan di browser.
-   Jangan menambahkan analytics pada MVP tanpa kebutuhan yang jelas.
-   Sediakan cara untuk menghapus preferensi lokal jika aplikasi
    menyimpannya.

### Risiko dan mitigasi

  -----------------------------------------------------------------------
  Risiko                              Mitigasi
  ----------------------------------- -----------------------------------
  Input besar membekukan UI           Evaluasi Web Worker dan batas
                                      ukuran

  XSS dari input                      Hindari render HTML mentah; lakukan
                                      escaping/sanitasi sesuai konteks

  XML parser error                    Validasi hasil parse dan tampilkan
                                      error yang jelas

  Konten sensitif tersimpan           Jangan persist input secara default

  Clipboard gagal                     Tangani permission/API error dan
                                      sediakan fallback yang layak

  File terlalu besar                  Beri batas dan feedback yang jelas

  Regex berbahaya/mahal               Pertimbangkan timeout/isolasi dan
                                      batas input

  JWT disalahartikan aman             Jelaskan bahwa decode bukan
                                      signature verification

  Hash disalahartikan enkripsi        Beri label dan dokumentasi yang
                                      benar
  -----------------------------------------------------------------------

Browser-first tidak otomatis berarti aman. Tetap diperlukan pengujian
dan penanganan input yang tepat.

------------------------------------------------------------------------

## 8. Community dan Feature Request

Fitur saran pengguna merupakan bagian dari konsep awal product.

Menu Community dapat menyediakan: 1. Suggest a Feature. 2. Report a Bug.
3. Public Roadmap (opsional setelah backlog mulai terbentuk).

### MVP: GitHub Issues

Gunakan GitHub Issues sebagai kanal awal karena: - Tidak memerlukan
backend sendiri. - Mendukung diskusi. - Mendukung label. - Terhubung
langsung dengan repository dan proses kontribusi.

Template feature request: - Feature name. - Problem to solve. - Expected
behavior. - Use case. - Additional notes.

Template bug report: - Ringkasan masalah. - Langkah reproduksi. -
Expected result. - Actual result. - Browser/device (bila relevan). -
Screenshot/log yang tidak berisi data sensitif.

Label yang disarankan: - `feature-request` - `bug` - `enhancement` -
`documentation` - `good first issue`

### Voting

Jangan membuat voting global menggunakan Local Storage. Itu hanya
menyimpan pilihan di browser masing-masing, bukan voting bersama.

Untuk MVP, manfaatkan reaksi atau mekanisme GitHub yang tersedia. Jika
kelak membuat voting sendiri, dibutuhkan backend atau layanan pihak
ketiga yang memiliki mekanisme identitas dan pencegahan penyalahgunaan.

**Penting:** jangan pernah memasukkan GitHub Personal Access Token atau
secret ke kode frontend publik.

------------------------------------------------------------------------

## 9. Open-source Repository

Agar benar-benar open-source oriented, repository sebaiknya memiliki:

-   `README.md`: tujuan, fitur, cara menjalankan, demo, dan cara
    kontribusi.
-   `LICENSE`: lisensi yang dipilih secara sadar.
-   `CONTRIBUTING.md`: aturan kontribusi.
-   `CHANGELOG.md`: catatan perubahan.
-   `CODE_OF_CONDUCT.md`: opsional tetapi disarankan jika menerima
    kontribusi publik.
-   Issue templates.
-   Pull request template.
-   Roadmap atau GitHub Projects bila diperlukan.

Lisensi belum ditentukan. Pilih lisensi open-source yang sesuai dengan
tujuan distribusi dan kontribusi sebelum publikasi resmi.

Nama product juga belum final. `DevKit Hub` hanya nama kerja dari
diskusi dan tidak boleh dianggap sebagai keputusan final.

------------------------------------------------------------------------

## 10. Deployment ke GitHub Pages

### Bentuk publikasi

Jika repository bernama `devkit-hub`:

``` text
https://<username>.github.io/devkit-hub/
```

Jika repository bernama `<username>.github.io`, URL dapat berada di root
domain:

``` text
https://<username>.github.io/
```

### Build dan deployment

Alur yang disarankan:

``` text
Local Development
       |
       v
Git Push
       |
       v
GitHub Repository
       |
       v
GitHub Actions
       |
       v
Install Dependencies
       |
       v
Lint / Test / Build
       |
       v
Deploy Artifact
       |
       v
GitHub Pages
```

### Konfigurasi Vite

Untuk project repository `devkit-hub`:

``` typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/devkit-hub/",
});
```

Untuk repository `<username>.github.io`, base biasanya `/`.

Nilai `base` harus sesuai dengan lokasi deployment. Kesalahan
konfigurasi dapat membuat asset CSS/JS gagal dimuat.

### Routing

GitHub Pages merupakan static hosting dan tidak menyediakan server-side
rewrite umum untuk semua route SPA.

Pertimbangkan hash-based routing, misalnya:

``` text
/#/tools/case-converter
/#/tools/json-formatter
/#/tools/text-diff
/#/community
```

Alternatif routing dapat digunakan jika fallback deployment telah diuji
dengan benar.

### Batas platform

GitHub Pages: - Cocok untuk static frontend. - Tidak menjalankan backend
Spring Boot atau server runtime. - Tidak menyediakan database
aplikasi. - Tidak dapat menyimpan secret frontend secara aman. - Dapat
menggunakan layanan eksternal, tetapi ketergantungan dan risikonya perlu
dinilai.

Untuk MVP browser-first, keterbatasan ini tidak menjadi penghalang.

------------------------------------------------------------------------

## 11. Roadmap Pengembangan

### Phase 1 --- Foundation

Deliverable: - Keputusan nama dan identitas product. - Product
requirements. - Setup React + TypeScript + Vite. - Design system
dasar. - Layout dan navigasi. - Routing. - Tool registry. - Responsive
behavior.

### Phase 2 --- Core Utilities

Implementasi: - Case Converter. - JSON Formatter. - XML Formatter. -
Text Diff. - JSON Diff.

Setiap tool dilengkapi validasi, error handling, dan test sesuai
perilaku yang disepakati.

### Phase 3 --- Product Experience

Peningkatan: - Search tools. - Keyboard shortcut atau command palette
bila dibutuhkan. - Dark/Light theme. - Copy/reset/download yang
konsisten. - Dokumentasi singkat per tool.

Favorites dan recent tools dapat ditunda sampai ada kebutuhan.

### Phase 4 --- Community

Implementasi: - Suggest a Feature. - Bug Report. - Issue templates. -
Roadmap publik bila bermanfaat. - Panduan kontribusi.

### Phase 5 --- Expansion

Tambahkan utility berdasarkan kebutuhan pengguna, misalnya: - Base64. -
URL Encoder/Decoder. - UUID. - Timestamp. - SQL Formatter. - Regex
Tester. - JWT Decoder. - XML Diff. - HTML Entity Encoder/Decoder.

------------------------------------------------------------------------

## 12. Quality, Testing, dan Definition of Done

### Acceptance criteria umum

Setiap utility harus: - Memiliki tujuan dan deskripsi yang jelas. -
Menerima input sesuai spesifikasi. - Memvalidasi input. - Menampilkan
error yang bisa dipahami. - Menghasilkan output yang benar. -
Menyediakan copy bila relevan. - Menyediakan reset/clear bila relevan. -
Tidak mengirim input ke server tanpa keputusan eksplisit. - Dapat
digunakan pada viewport desktop dan mobile. - Memiliki unit test untuk
logic penting.

### Acceptance criteria MVP

-   Lima utility MVP dapat digunakan.
-   Tidak ada error kritis pada alur utama.
-   Build production berhasil.
-   Test logic utama lulus.
-   Routing dan asset bekerja pada GitHub Pages subpath.
-   README dan instruksi penggunaan tersedia.
-   Feature request dan bug report dapat diakses.
-   Tidak ada credential/secret di repository atau bundle frontend.
-   Privacy behavior dijelaskan.

### Quality metrics yang dapat dipertimbangkan setelah rilis

-   Tool usage (tanpa mengumpulkan isi input).
-   Returning users (hanya jika analytics kelak diputuskan).
-   Error rate.
-   Performance dan bundle size.
-   Jumlah feature request yang relevan.
-   Issue yang berhasil direproduksi dan diselesaikan.

Analytics bukan prasyarat MVP.

------------------------------------------------------------------------

## 13. Risiko Product dan Engineering

  -----------------------------------------------------------------------
  Risiko                  Dampak                  Respons
  ----------------------- ----------------------- -----------------------
  Terlalu banyak fitur    Rilis tertunda dan      Batasi MVP
  sejak awal              kualitas tidak merata   

  UI tidak konsisten      Pengalaman penggunaan   Shared design system
                          membingungkan           

  Logic saling bergantung Perubahan satu tool     Modular feature
                          merusak tool lain       architecture

  Diff ambigu             Hasil perbandingan      Definisikan aturan dan
                          tidak sesuai ekspektasi edge cases

  Input besar             Browser lambat atau     Ukur performa dan
                          freeze                  gunakan Worker bila
                                                  perlu

  Routing Pages salah     Deep link atau asset    Uji base path dan
                          gagal                   fallback

  Request spam            Backlog sulit dikelola  Issue templates, label,
                                                  moderasi

  Dependency berlebihan   Bundle besar dan        Audit dependency
                          maintenance tinggi      

  Istilah teknis          Pengguna salah memahami Beri penjelasan
  menyesatkan             keamanan                encoding/hash/JWT
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 14. Keputusan yang Sudah Disepakati vs Belum Final

### Arah yang sudah disepakati

-   Satu website, satu product, banyak utility.
-   Target utama adalah kebutuhan developer.
-   Website akan dipublikasikan melalui GitHub Pages.
-   Utility inti diproses di browser.
-   UI harus compact dan ringan, tetapi tidak terlalu sederhana.
-   Product perlu memiliki nuansa open-source.
-   Hindari printilan dan fitur yang tidak diperlukan.
-   Feature suggestion dari pengguna merupakan bagian konsep.
-   Pengembangan dilakukan bertahap.
-   Arsitektur harus modular agar utility baru mudah ditambahkan.

### Rekomendasi yang belum menjadi keputusan final

-   Nama product: `DevKit Hub` masih nama kerja.
-   Layout: utility independen dengan shared UI/shared engine adalah
    rekomendasi sementara.
-   Stack: React + TypeScript + Vite adalah rekomendasi.
-   Styling: CSS/Tailwind belum dikunci.
-   Routing: hash-based routing direkomendasikan untuk mengurangi
    masalah GitHub Pages.
-   Lima utility MVP: Case Converter, JSON Formatter, XML Formatter,
    Text Diff, JSON Diff.
-   Community MVP: GitHub Issues.
-   Lisensi open-source belum dipilih.
-   Detail UI dan design tokens belum ditetapkan.

### Pertanyaan yang perlu diputuskan sebelum implementasi

1.  Nama final product dan domain/repository.
2.  Lisensi open-source.
3.  Layout final: halaman utility independen atau workspace terpadu.
4.  Detail perilaku setiap formatter dan diff.
5.  Apakah XML/JSON conversion masuk MVP atau backlog.
6.  Batas ukuran input dan dukungan file.
7.  Apakah command palette diperlukan pada rilis pertama.

------------------------------------------------------------------------

## 15. Langkah Berikutnya

Jangan langsung membangun seluruh fitur. Turunkan blueprint ini menjadi
artefak engineering dengan urutan:

1.  **PRD:** kebutuhan, user stories, scope, dan acceptance criteria
    tiap utility.
2.  **Information Architecture:** kategori, navigasi, dan struktur
    halaman.
3.  **UI Specification:** layout, komponen, responsive behavior, dan
    states.
4.  **Technical Design:** registry, module boundaries, routing, data
    flow, testing.
5.  **Backlog:** task implementasi terurut dan estimasi kompleksitas.
6.  **Repository Setup:** project scaffold, lint/test/build, CI/CD.
7.  **MVP Implementation:** implementasi dan verifikasi lima utility.
8.  **Release:** dokumentasi, license, GitHub Pages, dan feedback
    channel.

**Aturan utama:** setiap keputusan implementasi harus dapat ditelusuri
ke kebutuhan produk. Jangan menambahkan fitur atau dependency hanya
karena terlihat menarik.
