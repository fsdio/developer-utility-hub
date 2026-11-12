import { useEffect, useRef, type ReactNode } from "react";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { useRecentTools } from "@/hooks/useRecentTools";
import { CATEGORY_LABELS, TOOLS, type ToolMeta } from "@/registry/tools";

interface ToolLayoutProps {
  tool: ToolMeta;
  toolbar?: ReactNode;
  children: ReactNode;
}

/** Tool lain di kategori yang sama — menjaga konteks tanpa kembali ke beranda. */
function RelatedTools({ tool }: { tool: ToolMeta }) {
  const siblings = TOOLS.filter((item) => item.category === tool.category && item.id !== tool.id);
  if (siblings.length === 0) return null;

  return (
    <nav className="related-tools" aria-labelledby="related-heading">
      <h2 id="related-heading" className="category-title">
        Tool {CATEGORY_LABELS[tool.category]} lainnya
      </h2>
      <div className="related-row">
        {siblings.map((sibling) => (
          <a key={sibling.id} className="related-link" href={sibling.route}>
            {sibling.name}
            <span aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export function ToolLayout({ tool, toolbar, children }: ToolLayoutProps) {
  const { record } = useRecentTools();

  // Catat tool yang dibuka agar beranda bisa menampilkan "terakhir dipakai".
  // Hanya id tool yang disimpan — tidak ada isi input (PRD §3).
  const recordId = useRef(record);
  recordId.current = record;

  useEffect(() => {
    // Cukup sekali per tool yang dibuka, bukan setiap kali daftar berubah.
    recordId.current(tool.id);
  }, [tool.id]);

  return (
    <article>
      <header className="tool-header">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "#/" },
            { label: CATEGORY_LABELS[tool.category] },
            { label: tool.name },
          ]}
        />
        <div className="title-row">
          <h1 tabIndex={-1} data-route-heading>
            {tool.name}
          </h1>
          <span className="badge">{CATEGORY_LABELS[tool.category]}</span>
        </div>
        <p className="tool-description">{tool.description}</p>
      </header>

      {toolbar ? <div className="toolbar">{toolbar}</div> : null}

      {children}

      <RelatedTools tool={tool} />

      {tool.limitations.length > 0 ? (
        <section className="limitations" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading">
            <span aria-hidden="true">ⓘ</span> Catatan keterbatasan
          </h2>
          <ul>
            {tool.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
