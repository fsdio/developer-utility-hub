import { useEffect, useMemo, useState } from "react";
import { ToolRow } from "@/features/home/ToolRow";
import { useRecentTools } from "@/hooks/useRecentTools";
import {
  CATEGORY_HINTS,
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
const QUICK_PICKS = ["json-formatter", "text-diff", "base64", "jwt-verify", "hash", "timestamp"] as const;

/**
 * Katalog beranda berbentuk daftar (ADR-0019).
 *
 * Grup = tugas, bukan jenis berkas, sehingga satu baris selalu menjawab "saya
 * mau apa". Setiap grup bisa dilipat supaya halaman tetap pendek: jumlah klik
 * untuk membuka tool tetap satu, sama seperti kartu.
 */
export function HomePage({ initialCategory }: HomePageProps) {
  const [filter, setFilter] = useState<ToolCategory | "all">(
    initialCategory && isToolCategory(initialCategory) ? initialCategory : "all",
  );
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<ReadonlySet<ToolCategory>>(() => new Set());
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

  const toggleGroup = (category: ToolCategory): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1 tabIndex={-1} data-route-heading>
            Utility developer, langsung di browser
          </h1>
          <p>
            {TOOLS.length} tool untuk memformat, membandingkan, meng-encode, dan memeriksa token —
            tanpa membuka banyak tab atau menulis script sementara. Semua berjalan di perangkat kamu.
          </p>
        </div>
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
            placeholder="Cari: json, base64, jwt…"
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
            <ul className="tool-list">
              {searchResults.map((tool) => (
                <li key={tool.id}>
                  <ToolRow tool={tool} showCategory />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        groups.map((group) => {
          const isCollapsed = collapsed.has(group.category);
          const headingId = `cat-${group.category}`;
          return (
            <section
              className="category-block"
              key={group.category}
              aria-labelledby={headingId}
            >
              <div className="category-head">
                <h2 className="category-title" id={headingId}>
                  {group.label}
                  <span className="category-count">{group.tools.length}</span>
                </h2>
                <p className="category-hint">{CATEGORY_HINTS[group.category]}</p>
                <button
                  type="button"
                  className="link-button"
                  aria-expanded={!isCollapsed}
                  aria-controls={`list-${group.category}`}
                  onClick={() => toggleGroup(group.category)}
                >
                  {isCollapsed ? "Buka" : "Lipat"}
                </button>
              </div>
              <ul className="tool-list" id={`list-${group.category}`} hidden={isCollapsed}>
                {group.tools.map((tool) => (
                  <li key={tool.id}>
                    <ToolRow tool={tool} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <section className="category-block" aria-labelledby="community-heading">
        <h2 className="category-title" id="community-heading">
          Community
        </h2>
        <ul className="tool-list">
          <li>
            <a className="tool-row" href="#/community">
              <span className="tool-row-name">Suggest a Feature</span>
              <span className="tool-row-desc">Usulkan utility baru lewat GitHub Issues, lengkap dengan use case.</span>
              <span className="tool-row-action" aria-hidden="true">
                →
              </span>
            </a>
          </li>
          <li>
            <a className="tool-row" href="#/community">
              <span className="tool-row-name">Report a Bug</span>
              <span className="tool-row-desc">Laporkan perilaku yang salah dengan langkah reproduksi yang jelas.</span>
              <span className="tool-row-action" aria-hidden="true">
                →
              </span>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
