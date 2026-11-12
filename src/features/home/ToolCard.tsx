import type { ToolMeta } from "@/registry/tools";

const STATUS_LABEL: Record<ToolMeta["status"], string> = {
  stable: "Siap dipakai",
  planned: "Segera",
};

/**
 * Kartu katalog. Setiap kartu memberi tiga hal yang sama supaya mudah
 * dipindai: nama tool, satu kalimat kegunaan, dan penanda kategori.
 * Afordans "Buka" hanya muncul saat hover/fokus agar tidak berisik.
 */
export function ToolCard({ tool }: { tool: ToolMeta }) {
  const content = (
    <>
      <span className="tool-card-kicker">{tool.keywords[0] ?? tool.id}</span>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <span className="tool-card-foot">
        <span className="keyword-row">
          {tool.keywords.slice(0, 2).map((keyword) => (
            <span className="keyword" key={keyword}>
              {keyword}
            </span>
          ))}
        </span>
        <span className="tool-card-open" aria-hidden="true">
          Buka →
        </span>
      </span>
    </>
  );

  if (tool.status === "planned") {
    return (
      <div className="tool-card" aria-disabled="true">
        {content}
        <span className="badge">{STATUS_LABEL.planned}</span>
      </div>
    );
  }

  return (
    <a className="tool-card" href={tool.route}>
      {content}
      <span className="sr-only">{STATUS_LABEL[tool.status]}</span>
    </a>
  );
}
