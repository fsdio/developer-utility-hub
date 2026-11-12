import { TOOLS } from "@/registry/tools";

export function NotFoundPage() {
  return (
    <>
      <header className="tool-header">
        <h1 tabIndex={-1} data-route-heading>
          Halaman tidak ditemukan
        </h1>
        <p className="tool-description">
          Alamat yang Anda buka tidak dikenal. Coba salah satu tool di bawah, atau gunakan pencarian
          di header.
        </p>
      </header>

      <div className="card-grid">
        {TOOLS.map((tool) => (
          <a className="tool-card" href={tool.route} key={tool.id}>
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>

      <p style={{ marginTop: "var(--space-4)" }}>
        <a href="#/">← Kembali ke beranda</a>
      </p>
    </>
  );
}
