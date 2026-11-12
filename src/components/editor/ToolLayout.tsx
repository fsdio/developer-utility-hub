import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { CATEGORY_LABELS, type ToolMeta } from "@/registry/tools";

interface ToolLayoutProps {
  tool: ToolMeta;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function ToolLayout({ tool, toolbar, children }: ToolLayoutProps) {
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

      {tool.limitations.length > 0 ? (
        <section className="limitations" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading">Catatan keterbatasan</h2>
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
