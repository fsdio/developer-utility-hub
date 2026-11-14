import { PREFERENCE_KEYS } from "@/lib/browser/storage";

const PREFERENCE_LIST: ReadonlyArray<{ key: string; purpose: string }> = [
  { key: PREFERENCE_KEYS.theme, purpose: "Pilihan tema terang/gelap/sistem." },
  { key: PREFERENCE_KEYS.caseConverterStyle, purpose: "Gaya case terakhir yang dpilih." },
  { key: PREFERENCE_KEYS.jsonIndent, purpose: "Preferensi indentasi JSON." },
  { key: PREFERENCE_KEYS.xmlOptions, purpose: "Preferensi opsi XML (preserve comments)." },
  { key: PREFERENCE_KEYS.textDiffOptions, purpose: "Preferensi opsi diff (ignore case/whitespace)." },
];

export function PrivacyPage() {
  return (
    <>
      <header className="tool-header">
        <h1 tabIndex={-1} data-route-heading>
          Privasi
        </h1>
        <p className="tool-description">
          Ringkasan apa yang tidak dikirim, apa yang disimpan, dan cara menghapusnya.
        </p>
      </header>

      <div className="prose">
        <h2>Tidak pernah dikirim</h2>
        <p>
          Isi input Anda tidak dikirim ke server mana pun. Tidak ada backend, tidak ada analytics,
          dan Content Security Policy aplikasi menetapkan <code>connect-src 'self'</code> sehingga
          browser hanya mengizinkan permintaan ke origin ini sendiri — praktisnya satu berkas
          <code>version.json</code> untuk memeriksa apakah ada build baru. Tidak ada permintaan
          yang pernah membawa isi input Anda.
        </p>

        <h2>Tidak pernah disimpan</h2>
        <ul>
          <li>Isi input, hasil output, dan riwayat tidak ditulis ke penyimpanan apa pun.</li>
          <li>Isi dokumen tidak pernah masuk ke URL, sehingga tidak ada share-link berisi data Anda.</li>
          <li>Tidak ada cookie.</li>
        </ul>

        <h2>Yang disimpan (preferensi tampilan saja)</h2>
        <ul>
          {PREFERENCE_LIST.map((item) => (
            <li key={item.key}>
              <code>{item.key}</code> — {item.purpose}
            </li>
          ))}
        </ul>
        <p>
          Semua tersimpan di <code>localStorage</code> browser Anda dan tidak pernah dikirim ke mana
          pun. Menghapus data situs lewat pengaturan browser akan menghapus semuanya.
        </p>

        <h2>Catatan keamanan tool</h2>
        <ul>
          <li>Encoding dan Base64 bukan enkripsi.</li>
          <li>Hash tidak dapat dibalik dan bukan enkripsi.</li>
          <li>JWT decoder (bila tersedia kelak) hanya mendekode, bukan memverifikasi signature.</li>
        </ul>
      </div>
    </>
  );
}
