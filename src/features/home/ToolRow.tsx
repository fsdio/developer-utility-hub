import type { ToolMeta } from "@/registry/tools";
import { CATEGORY_LABELS } from "@/registry/tools";

const STATUS_LABEL: Record<ToolMeta["status"], string> = {
  stable: "Siap dipakai",
  planned: "Segera",
};

/**
 * Baris katalog (ADR-0019) — menggantikan kartu.
 *
 * Satu baris = satu tool: nama, satu kalimat, penanda kategori. Tingginya tetap
 * dan seragam, jadi seluruh katalog bisa dipindai dengan gerakan mata vertikal
 * saja tanpa menggulir berlebihan seperti pada grid kartu.
 */
export function ToolRow({ tool, showCategory = false }: { tool: ToolMeta; showCategory?: boolean }) {
  const body = (
    <>
      <span className="tool-row-name">{tool.name}</span>
      <span className="tool-row-desc">{tool.description}</span>
      <span className="tool-row-meta">
        {showCategory ? <span className="tool-row-badge">{CATEGORY_LABELS[tool.category]}</span> : null}
        {tool.keywords.slice(0, 2).map((keyword) => (
          <span className="keyword" key={keyword}>
            {keyword}
          </span>
        ))}
      </span>
    </>
  );

  if (tool.status === "planned") {
    return (
      <div className="tool-row tool-row--disabled" aria-disabled="true">
        {body}
        <span className="badge">{STATUS_LABEL.planned}</span>
      </div>
    );
  }

  return (
    <a className="tool-row" href={tool.route}>
      {body}
      <span className="tool-row-action" aria-hidden="true">
        →
      </span>
      <span className="sr-only">{STATUS_LABEL[tool.status]}</span>
    </a>
  );
}
