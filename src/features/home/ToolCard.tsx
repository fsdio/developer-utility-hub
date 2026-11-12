import type { ToolMeta } from "@/registry/tools";

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const content = (
    <>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <span className="keyword-row">
        {tool.keywords.slice(0, 3).map((keyword) => (
          <span className="keyword" key={keyword}>
            {keyword}
          </span>
        ))}
      </span>
    </>
  );

  if (tool.status === "planned") {
    return (
      <div className="tool-card" aria-disabled="true">
        {content}
        <span className="badge">Segera</span>
      </div>
    );
  }

  return (
    <a className="tool-card" href={tool.route}>
      {content}
    </a>
  );
}
