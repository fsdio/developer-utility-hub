import { useEffect, useState } from "react";
import { ToolCard } from "@/features/home/ToolCard";
import { CATEGORY_LABELS, isToolCategory, toolsByCategory, type ToolCategory } from "@/registry/tools";

interface HomePageProps {
  initialCategory?: string;
}

export function HomePage({ initialCategory }: HomePageProps) {
  const [filter, setFilter] = useState<ToolCategory | "all">(
    initialCategory && isToolCategory(initialCategory) ? initialCategory : "all",
  );

  useEffect(() => {
    setFilter(initialCategory && isToolCategory(initialCategory) ? initialCategory : "all");
  }, [initialCategory]);

  const groups = toolsByCategory().filter((group) => filter === "all" || group.category === filter);

  return (
    <>
      <section className="hero">
        <h1 tabIndex={-1} data-route-heading>
          Utility developer, langsung di browser
        </h1>
        <p>
          Format data, konversi teks, dan bandingkan dokumen tanpa membuka banyak tab atau menulis
          script sementara. Lima belas tool, satu pengalaman yang konsisten.
        </p>
        <span className="privacy-note">
          Semua diproses di browser Anda. Tidak ada yang dikirim ke server.
        </span>
      </section>

      <div className="chip-row" role="group" aria-label="Filter kategori">
        <button
          type="button"
          className="chip"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Semua
        </button>
        {toolsByCategory().map((group) => (
          <button
            key={group.category}
            type="button"
            className="chip"
            aria-pressed={filter === group.category}
            onClick={() => setFilter(group.category)}
          >
            {CATEGORY_LABELS[group.category]}
          </button>
        ))}
      </div>

      {groups.map((group) => (
        <section className="category-block" key={group.category} aria-labelledby={`cat-${group.category}`}>
          <h2 className="category-title" id={`cat-${group.category}`}>
            {group.label}
          </h2>
          <div className="card-grid">
            {group.tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ))}

      <section className="category-block" aria-labelledby="community-heading">
        <h2 className="category-title" id="community-heading">
          Community
        </h2>
        <div className="card-row">
          <a className="tool-card" href="#/community">
            <h3>Suggest a Feature</h3>
            <p>Usulkan utility baru lewat GitHub Issues, lengkap dengan use case.</p>
          </a>
          <a className="tool-card" href="#/community">
            <h3>Report a Bug</h3>
            <p>Laporkan perilaku yang salah dengan langkah reproduksi yang jelas.</p>
          </a>
        </div>
      </section>
    </>
  );
}
