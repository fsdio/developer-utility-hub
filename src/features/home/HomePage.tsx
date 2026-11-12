import { useEffect, useMemo, useState } from "react";
import { ToolCard } from "@/features/home/ToolCard";
import { useRecentTools } from "@/hooks/useRecentTools";
import {
  CATEGORY_LABELS,
  isToolCategory,
  searchTools,
  TOOLS,
  toolsByCategory,
  type ToolCategory,
} from "@/registry/tools";

interface HomePageProps {
  initialCategory?: string;
}

/** Tool yang paling sering dipakai developer sehari-hari, urut prioritas. */
const QUICK_PICKS = ["json-formatter", "text-diff", "base64", "jwt", "hash", "timestamp"] as const;

export function HomePage({ initialCategory }: HomePageProps) {
  const [filter, setFilter] = useState<ToolCategory | "all">(
    initialCategory && isToolCategory(initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState("");
  const { recent } = useRecentTools();

  useEffect(() => {
    setFilter(initialCategory && isToolCategory(initialCategory) ? initialCategory : "all");
  }, [initialCategory]);

  const quickPicks = useMemo(
    () => QUICK_PICKS.map((id) => TOOLS.find((tool) => tool.id === id)).filter((tool) => tool !== undefined),
    [],
  );

  const recentTools = useMemo(
    () =>
      recent
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter((tool) => tool !== undefined),
    [recent],
  );

  const trimmedQuery = query.trim();
  const searching = trimmedQuery !== "";
  const searchResults = searching ? searchTools(trimmedQuery).slice(0, 12) : [];
  const groups = toolsByCategory().filter((group) => filter === "all" || group.category === filter);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1 tabIndex={-1} data-route-heading>
            Utility developer, langsung di browser
          </h1>
          <p>
            Format data, konversi teks, dan bandingkan dokumen tanpa membuka banyak tab atau menulis
            script sementara. Lima belas tool, satu pengalaman yang konsisten.
          </p>
        </div>
        <span className="privacy-note">
          <span aria-hidden="true">◍</span> Semua diproses di browser Anda — tidak ada yang dikirim
          ke server.
        </span>
      </section>

      <section className="quick-picks" aria-labelledby="quick-picks-heading">
        <h2 className="category-title" id="quick-picks-heading">
          Paling sering dipakai
        </h2>
        <div className="quick-pick-row">
          {quickPicks.map((tool) => (
            <a className="quick-pick" key={tool.id} href={tool.route}>
              {tool.name}
            </a>
          ))}
        </div>
      </section>

      {recentTools.length > 0 ? (
        <section className="quick-picks" aria-labelledby="recent-heading">
          <h2 className="category-title" id="recent-heading">
            Terakhir kamu buka
          </h2>
          <div className="quick-pick-row">
            {recentTools.map((tool) => (
              <a className="quick-pick quick-pick--recent" key={tool.id} href={tool.route}>
                {tool.name}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="catalog-controls">
        <div className="chip-row" role="group" aria-label="Filter kategori">
          <button
            type="button"
            className="chip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Semua ({TOOLS.length})
          </button>
          {toolsByCategory().map((group) => (
            <button
              key={group.category}
              type="button"
              className="chip"
              aria-pressed={filter === group.category}
              onClick={() => setFilter(group.category)}
            >
              {CATEGORY_LABELS[group.category]} ({group.tools.length})
            </button>
          ))}
        </div>

        <label className="catalog-search">
          <span className="sr-only">Cari tool berdasarkan nama atau kata kunci</span>
          <input
            type="search"
            value={query}
            placeholder="Cari: json, base64, diff…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {searching ? (
        <section className="category-block" aria-labelledby="search-heading">
          <h2 className="category-title" id="search-heading">
            Hasil pencarian “{trimmedQuery}”
          </h2>
          {searchResults.length === 0 ? (
            <p className="hint-text">Tidak ada tool yang cocok. Coba kata kunci lain.</p>
          ) : (
            <div className="card-grid">
              {searchResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>
      ) : (
        groups.map((group) => (
          <section
            className="category-block"
            key={group.category}
            aria-labelledby={`cat-${group.category}`}
          >
            <h2 className="category-title" id={`cat-${group.category}`}>
              {group.label}
            </h2>
            <div className="card-grid">
              {group.tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}

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
