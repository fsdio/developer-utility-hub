# ADR-0006 — Stack, versi dependency, dan keinvarianan build

- **Status:** Accepted
- **Tanggal:** 2026-11-12
- **Menutup:** blueprint §6 ("Stack yang direkomendasikan"), §10 (deployment),
  serta koreksi kontradiksi "Diff: library `diff`" untuk JSON Diff.

## Konteks

Blueprint merekomendasikan React + TypeScript + Vite, tetapi tidak mengunci versi,
tidak menetapkan strategi styling, dan tidak menyebut konsekuensi TypeScript 7
(compiler native) terhadap `typescript-eslint`. Blueprint juga menempatkan library
`diff` di baris "Diff" tanpa membedakan text diff dari JSON diff.

## Keputusan

### 1. Versi yang dikunci

| Area | Pilihan | Versi |
|---|---|---|
| Runtime | React + React DOM | 19 |
| Bahasa | TypeScript | **5.9** (bukan 7) |
| Build | Vite + @vitejs/plugin-react | 8 / 6 |
| Styling | **CSS murni** dengan custom properties (design tokens) | — |
| Icons | Lucide (`lucide-react`) | 1.x, alias `currentColor` |
| Routing | Hash-based, router ditulis sendiri (~120 baris) | — |
| State | React state + custom hooks | — |
| Diff (text) | `diff` npm | 9 |
| Test | Vitest + jsdom + React Testing Library | 5 / 31 / 16 |
| Lint | ESLint 10 + typescript-eslint | 10 / 8 |
| CI | GitHub Actions → GitHub Pages | — |

### 2. TypeScript 5.9, bukan 7

TypeScript 7 adalah compiler native (port Go) yang pada saat ADR ini ditulis baru
dirilis dan **belum didukung `typescript-eslint`** (peer range `>=4.8.4 <6.1.0`).
Memilih TS 7 berarti kehilangan linting tipe berbasis aturan. TS 5.9 memenuhi semua
kebutuhan proyek ini. Revisit bila typescript-eslint merilis dukungan resmi.

### 3. Styling: CSS murni, bukan Tailwind

- Blueprint menyebut "CSS atau Tailwind", belum dikunci (§14).
- Tool ini punya kebutuhan visual yang sempit dan berulang (panel, toolbar, badge
  diff, tabel). CSS dengan tokens (`--color-*`, `--space-*`, `--font-*`) memenuhi
  kebutuhan tanpa build step tambahan dan tanpa kelas utilitas di markup.
- Dark/light theme cukup dengan `[data-theme]` + custom properties.
- Konsekuensi: tidak ada dependency styling; bundle CSS satu file.

### 4. Router sendiri, bukan React Router

Kebutuhan routing hanya: hash route, satu param, redirect, 404. React Router
menambah ~10 KB gzip untuk itu. Router sendiri juga membuat perilaku `base` pada
GitHub Pages sepenuhnya eksplisit dan bisa diuji.

### 5. Library `diff` hanya untuk Text Diff

JSON Diff memakai implementasi struktural sendiri (ADR-0002). Baris "Diff" di
blueprint §6 dikoreksi maknanya di `docs/technical-design.md`.

### 6. Base path

`base: "/developer-utility-hub/"` — mengikuti nama repository sebenarnya, bukan
`/devkit-hub/` (contoh di blueprint). Overridable via `VITE_BASE_PATH` sehingga
build untuk `<username>.github.io` (root) tidak perlu mengedit kode.

### 7. Keinvarianan build & deploy

- `404.html` + skrip redirect hash: hash routing tidak butuh rewrite server, tetapi
  `404.html` tetap disediakan agar deep link yang salah tetap mendarat di aplikasi.
- `.nojekyll` ditulis ke artefak agar folder `assets/` tidak diabaikan Jekyll.
- CI: `lint → typecheck → test → build → preview-check base path → deploy` hanya dari `main`.

## Konsekuensi

- Positif: dependency minimal (react, react-dom, diff, lucide-react), build cepat,
  risiko rantai pasok kecil.
- Negatif: menulis sendiri router dan beberapa komponen UI (tanpa shadcn/ui);
  biaya ini diterima karena jumlah komponennya kecil dan spesifik.
- Risiko yang dipantau: Vite 8 & React 19 masih relatif baru; CI memakai versi
  terkunci via `package-lock.json` agar build tidak berubah diam-diam.

## Alternatif yang ditolak

- **shadcn/ui**: membawa Radix + Tailwind + `clsx`/`cva`; berlebihan untuk 5 tool
  dengan komponen seragam.
- **Zustand**: state aplikasi hanya tema + preferensi tool; React state cukup.
- **React Router**: dependency untuk kebutuhan routing yang minimal.
- **TypeScript 7**: tidak kompatibel dengan toolchain lint saat ini.
