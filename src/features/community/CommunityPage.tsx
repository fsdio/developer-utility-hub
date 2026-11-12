const ISSUES_URL = "https://github.com/fsdio/developer-utility-hub/issues/new/choose";

export function CommunityPage() {
  return (
    <>
      <header className="tool-header">
        <h1 tabIndex={-1} data-route-heading>
          Community
        </h1>
        <p className="tool-description">
          Saran fitur dan laporan bug dikelola lewat GitHub Issues. Tidak ada formulir lokal, karena
          aplikasi ini tidak memiliki backend.
        </p>
      </header>

      <div className="card-row">
        <a className="tool-card" href={ISSUES_URL} rel="noreferrer noopener" target="_blank">
          <h3>Suggest a Feature</h3>
          <p>Sertakan: nama fitur, masalah yang diselesaikan, perilaku yang diharapkan, use case.</p>
        </a>
        <a className="tool-card" href={ISSUES_URL} rel="noreferrer noopener" target="_blank">
          <h3>Report a Bug</h3>
          <p>
            Sertakan: ringkasan, langkah reproduksi, hasil yang diharapkan vs aktual, browser.
            Jangan lampirkan data sensitif.
          </p>
        </a>
      </div>

      <div className="prose" style={{ marginTop: "var(--space-5)" }}>
        <h2>Yang perlu diketahui</h2>
        <ul>
          <li>Tool baru dipilih berdasarkan kebutuhan nyata, bukan jumlah fitur.</li>
          <li>Backlog ekspansi mencakup Base64, URL encoder, UUID, hash, dan lainnya.</li>
          <li>Tidak ada voting di dalam aplikasi — reaksi GitHub dipakai sebagai gantinya.</li>
        </ul>
      </div>
    </>
  );
}
