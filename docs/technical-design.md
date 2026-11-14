# Technical Design — Developer Utility Hub

> Turunan blueprint §15 langkah 4. Mengunci registry, batas modul, routing,
> alur data, dan strategi testing. Mengacu pada ADR-0001..0006.

---

## 1. Gambaran arsitektur

Empat lapisan sesuai blueprint §6, dengan aturan ketergantungan searah:
**UI → Application → Engine**. Engine tidak pernah mengimpor dari UI atau Application.

```
┌──────────────────────────────────────────────────────────┐
│ Presentation   components/*, features/*/*View.tsx         │
├──────────────────────────────────────────────────────────┤
│ Application    app/router.tsx, registry/tools.ts,         │
│                hooks/*, stores/preferences                 │
├──────────────────────────────────────────────────────────┤
│ Utility Engine lib/text, lib/json, lib/xml, lib/diff      │
│                (fungsi murni, tanpa DOM/window)           │
├──────────────────────────────────────────────────────────┤
│ Browser        clipboard, blob download, localStorage     │
│                (diakses HANYA via lib/browser/*)          │
└──────────────────────────────────────────────────────────┘
```

**Aturan yang ditegakkan test**: tidak ada file di `src/lib/{text,json,xml,diff}/`
yang boleh mengimpor `react`, `react-dom`, atau menyentuh `window`/`document`.
Ini yang membuat eskalasi ke Web Worker (ADR-0005) murah.

## 2. Struktur folder

```
src/
├── app/
│   ├── App.tsx                 # shell + router + error boundary
│   ├── router.tsx              # hash router (~120 baris)
│   ├── routes.tsx              # peta route → lazy page
│   └── ErrorBoundary.tsx
├── components/
│   ├── layout/                 # AppShell, Header, Footer
│   ├── navigation/             # ToolSearch, Breadcrumb, CategoryTabs
│   ├── editor/                 # CodeArea, Panel, DiffView
│   └── common/                 # Button, CopyButton, ResetButton, DownloadButton,
│                               # StatusMessage, EmptyState, Kbd, Checkbox, Select
├── features/
│   ├── text/case-converter/    # CaseConverterPage.tsx
│   ├── data/json-formatter/
│   ├── data/xml-formatter/
│   ├── comparison/text-diff/
│   ├── comparison/json-diff/
│   ├── home/                   # HomePage, ToolCard, CategoryFilter
│   ├── community/
│   ├── privacy/
│   └── not-found/
├── registry/tools.ts
├── hooks/                      # useDebouncedValue, useCopy, useDownload,
│                               # useLocalStoragePreference, useHashRoute
├── lib/
│   ├── text/case.ts            # engine
│   ├── json/format.ts  json/error.ts
│   ├── xml/format.ts   xml/error.ts
│   ├── diff/text.ts    diff/json.ts   diff/json-patch.ts
│   └── browser/{clipboard.ts,download.ts,storage.ts}
├── types/
├── styles/{tokens.css, base.css}
└── main.tsx
```

Setiap folder feature berisi: `*Page.tsx` (UI + state), `*.test.tsx` (component test),
dan tidak berisi algoritma — algoritma ada di `lib/`.

## 3. Tool registry

```ts
// src/registry/tools.ts
export type ToolCategory = "text" | "formatter" | "diff" | "utilities";
export type ToolStatus = "stable" | "planned";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: readonly string[];
  route: string;                 // "#/tools/<id>"
  limitations: readonly string[];
  status: ToolStatus;
  load: () => Promise<{ default: React.ComponentType }>;
}

export const TOOLS: readonly ToolMeta[] = [...];

export const getTool = (id: string) => TOOLS.find(t => t.id === id);
export const toolsByCategory = () => /* grup, urutan kategori tetap */;
export const searchTools = (q: string) => /* IA §7 scoring */;
```

Aturan:
- `TOOLS` adalah array dingin; `load` memakai `import()` agar tiap tool jadi chunk sendiri.
- Kategori tanpa anggota tidak dirender (IA §1).
- `id` dipakai sebagai path route, pref key, dan `data-testid`. Tidak boleh diubah
  setelah rilis (breaking untuk URL); tambah alias bila perlu.

Ukuran chunk per tool setelah build diperiksa di CI: peringatan bila > 80 KB gzip.

## 4. Routing

Router sendiri, berbasis `hashchange`:

```ts
// hash → { name, params }
parseHash("#/tools/json-formatter") // { name: "tool", id: "json-formatter" }
```

- Path **selalu** dimulai `#/`; hash kosong → `#/`.
- `#/tools` → beranda.
- Route tak dikenal → `not-found`.
- Navigasi internal memakai `<a href="#/...">` (bukan `history.pushState`), sehingga
  tombol back/forward dan "buka di tab baru" bekerja tanpa kode tambahan.
- Setelah navigasi: `window.scrollTo(0,0)`, fokus dipindah ke `<h1>` container
  (`tabIndex={-1}`) untuk screen reader, `document.title` diperbarui.
- **Query/hash tidak pernah memuat isi input** (PRD §3). Satu-satunya state di URL
  adalah filter kategori beranda (`#/?kategori=formatter`), yang bukan data pengguna.

Konsekuensi untuk GitHub Pages: tidak perlu rewrite `routes`; `404.html` disalin dari
`index.html` dengan skrip pemulihan hash agar deep link tak dikenal tetap mendarat di app.

## 5. Alur data

Pola seragam per feature (tanpa state library):

```
useState(input)                         ← satu-satunya sumber isi dokumen
   ↓ useDebouncedValue(input, 200)
engine fn (pure)                        ← lib/*, tidak menyentuh DOM
   ↓ Result<T> = { ok: true, value } | { ok: false, error }
render output / StatusMessage
```

`Result` adalah tipe bersama di `src/types/result.ts`:

```ts
export type Ok<T>  = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = ToolError> = Ok<T> | Err<E>;

export interface ToolError {
  message: string;              // bahasa manusia
  line?: number; column?: number;
  detail?: string;              // cuplikan untuk <pre>
  kind: "parse" | "limit" | "depth" | "internal";
}
```

Aturan:
- Engine **tidak melempar exception** untuk input pengguna; semua kegagalan
  dikembalikan sebagai `Err`. `try/catch` hanya untuk kasus tak terduga di boundary.
- Engine tidak menyimpan state; input → output murni (mudah diuji & di-memo).
- Pemrosesan di-`useMemo` pada nilai yang sudah di-debounce.

## 6. Preferensi & persistensi

| Kunci | Nilai | Ditulis oleh |
|---|---|---|
| `duh:v1:theme` | `"light" \| "dark" \| "system"` | ThemeToggle |
| `duh:v1:json-formatter:indent` | `2 \| 4 \| "tab"` | JSON Formatter |
| `duh:v1:xml-formatter:preserveComments` | `"true" \| "false"` | XML Formatter |
| `duh:v1:text-diff:options` | JSON `{ignoreCase,ignoreWhitespace,view}` | Text Diff |

- Wrapper `lib/browser/storage.ts` menangani `localStorage` tidak tersedia
  (mode privat / diblokir) → fallback ke state memori, tanpa error ke pengguna.
- **Tidak ada** kunci yang menampung isi input. Diuji secara otomatis:
  test menulis routing/typing lalu mengaudit seluruh `localStorage` & `sessionStorage`
  dan memastikan tidak ada substring input.
- Halaman Privacy membaca daftar kunci ini dari satu konstanta `PREFERENCE_KEYS`
  agar dokumentasi tidak pernah menyimpang dari kode.

## 7. Batas modul & kepemilikan

| Modul | Boleh mengimpor | Tidak boleh |
|---|---|---|
| `lib/text|json|xml|diff` | hanya `types/`, `lib/` sesama engine | React, DOM, hooks |
| `lib/browser/*` | DOM API | engine |
| `components/*` | `types/`, `hooks/`, styles | `features/*` |
| `features/*` | `components/`, `hooks/`, `lib/`, `registry/` | `features/` lain |
| `app/*` | semuanya | — |

Aturan ini diuji dengan skrip impor sederhana di `scripts/check-boundaries.mjs`
(gagal di CI bila dilanggar), bukan hanya konvensi.

## 8. Error handling

1. **Tool-level**: `Result` + `StatusMessage`. Tidak ada `throw` untuk input salah.
2. **Route-level**: `ErrorBoundary` per route (di dalam `<Suspense>`) menangani
   kegagalan `import()` chunk dan render error: pesan singkat + tombol "Muat ulang".
3. **App-level**: satu `ErrorBoundary` di root menampilkan halaman minimal
   (header + pesan + link beranda), tanpa stack trace.
4. Error tidak pernah dilaporkan ke server (tidak ada endpoint; konsisten dengan privasi).

## 9. Keamanan

| Kontrol | Implementasi |
|---|---|
| XSS | Tidak ada `dangerouslySetInnerHTML` di seluruh repo (diuji via grep di CI). Semua output berupa teks di `<pre>`/`<textarea>`; highlight diff memakai node React, bukan HTML string. |
| Parser error XML | Teks via `textContent`, tidak pernah di-`innerHTML`. |
| Clipboard | Ditangani sebagai kegagalan yang terlihat, bukan error senyap. |
| Dependency | `npm audit` di CI (gagal pada severity high), Dependabot mingguan, `package-lock.json` di-commit. |
| Secret | Tidak ada secret di frontend; tautan GitHub Issues memakai URL publik saja. |
| CSP | Meta CSP di `index.html`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`. `connect-src 'none'` secara teknis **mencegah** pengiriman input ke mana pun. |
| Referrer | `<meta name="referrer" content="no-referrer">`. |

Catatan: `style-src 'self'` tanpa `'unsafe-inline'` berarti tidak boleh ada atribut
`style="..."`; semua styling lewat kelas. Vite menyuntik CSS sebagai file eksternal,
jadi ini aman.

## 10. Performa

| Target | Angka | Diverifikasi |
|---|---|---|
| JS awal (beranda) | < 200 KB gzip | `scripts/check-bundle.mjs` di CI |
| Chunk per tool | < 80 KB gzip | sama |
| Pemrosesan 1 MB | p95 < 100 ms (Chrome desktop), < 300 ms (Android mid-range) | benchmark manual dicatat di PR |
| LCP beranda | < 2,5 s pada 4G tersimulasi | Lighthouse manual sebelum rilis |

Lazy loading: beranda tidak memuat kode tool mana pun. `lucide-react` diimpor
per-ikon (`lucide-react/icons/...`) agar tree-shaking pasti.

## 11. Strategi testing

| Level | Tool | Cakupan wajib |
|---|---|---|
| Unit (engine) | Vitest | semua kasus uji PRD §6.1; tabel error JSON/XML; semua jenis node XML; diff struktural (added/removed/changed/type-changed, path escape); patch RFC 6902 |
| Component | Vitest + RTL | tiap tool: alur isi input → hasil, error state, copy, reset, over-limit |
| A11y | `vitest-axe` pada render tiap halaman | tidak ada pelanggaran level A/AA |
| Kontrak privasi | Vitest | tidak ada kunci storage berisi input; tidak ada `fetch`/`XHR` terpanggil (mock global) |
| Batas modul | `scripts/check-boundaries.mjs` | lihat §7 |
| Build | `scripts/check-bundle.mjs` | budget §10 |
| Deployment | `scripts/preview-check.mjs` (Playwright opsional) | `index.html` + `assets/*` 200 saat di-serve dari `/developer-utility-hub/` |

Bukan E2E penuh di MVP (blueprint: Playwright "bila cakupan memadai"). Smoke test
hasil build dijalankan di CI dengan `vite preview --base=/developer-utility-hub/`.

## 12. CI/CD

`.github/workflows/ci.yml` (pull request + push):

```
checkout → setup-node 22 (cache npm) → npm ci
  → npm run lint
  → npm run typecheck
  → npm run test -- --coverage
  → npm run build
  → node scripts/check-bundle.mjs
  → node scripts/check-boundaries.mjs
  → node scripts/check-contrast.mjs
  → npm run preview:check      (serve build di base path, uji 200 untuk index+asset)
```

`.github/workflows/deploy.yml` (push ke `main`): job CI yang sama → `upload-pages-artifact`
(`dist`) → `deploy-pages`. Permission minimum: `contents: read`, `pages: write`,
`id-token: write`; `concurrency: {group: pages, cancel-in-progress: false}`.
Tidak ada deploy dari branch lain atau dari PR fork.

### 12.1 Offline mode (ADR-0013)

`scripts/postbuild.mjs` menulis `dist/version.json` berisi `id` (sha256
`index.html`, 16 heksadesimal) dan `builtAt`. `public/sw.js` menyalin dirinya ke
`dist/`:

| Permintaan | Strategi |
|---|---|
| `assets/*` | cache-first (nama berkas ber-hash = immutable) |
| HTML / navigasi | network-first, fallback `index.html` dari cache |
| `version.json` | selalu jaringan, `cache: "no-store"` |

`registerOfflineMode()` (`src/lib/browser/register-sw.ts`) didaftarkan setelah
paint pertama **hanya pada `import.meta.env.PROD`**, membandingkan id server
dengan `duh:v1:build-version` di localStorage lewat `decideVersion()`. Beda id →
reload sekali dengan guard `sessionStorage` (`duh:reloaded-for-version`) agar
tidak terjadi loop. Offline → `unknown`, cache dipakai apa adanya.

Yang **tidak** boleh masuk cache/penyimpanan: isi input pengguna. Aturan ini
dijaga `src/test/privacy.test.tsx`.

Untuk menguji: `npm run build && npm run preview`, buka DevTools → Application →
Service Workers. Di mode dev, service worker tidak didaftarkan.

## 13. Traceability

| Blueprint | Dokumen ini |
|---|---|
| §6 arsitektur berlapis | §1, §7 |
| §6 tool registry | §3 |
| §6 struktur folder | §2 |
| §6 state & dependency minimal | §5, ADR-0006 |
| §7 Web Worker bila perlu | ADR-0005 §3 |
| §7 XSS/CSP/privasi | §9 |
| §10 base path & routing | §4, ADR-0006 §6 |
| §12 testing & DoD | §11, §12 |
