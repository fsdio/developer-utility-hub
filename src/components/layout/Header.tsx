import { useTheme } from "@/hooks/useTheme";
import { ToolSearch } from "@/components/navigation/ToolSearch";
import { CATEGORY_LABELS, TOOLS, type ToolCategory } from "@/registry/tools";

const REPO_URL = "https://github.com/fsdio/developer-utility-hub";

const NAV_CATEGORIES = (["text", "formatter", "diff"] as ToolCategory[]).filter((category) =>
  TOOLS.some((tool) => tool.category === category),
);

const NEXT_THEME_LABEL: Record<"light" | "dark" | "system", string> = {
  light: "Terang",
  dark: "Gelap",
  system: "Mengikuti sistem",
};

export function Header() {
  const { choice, cycle } = useTheme();

  return (
    <header className="site-header">
      <div className="container">
        <a className="brand" href="#/" aria-label="Developer Utility Hub, ke beranda">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>Developer Utility Hub</span>
        </a>

        <nav className="header-nav" aria-label="Kategori">
          {NAV_CATEGORIES.map((category) => (
            <a key={category} href={`#/?kategori=${category}`}>
              {CATEGORY_LABELS[category]}
            </a>
          ))}
        </nav>

        <span className="header-spacer" />

        <div className="header-tools">
          <ToolSearch />
          <button
            type="button"
            className="button button--ghost"
            onClick={cycle}
            aria-label={`Tema: ${NEXT_THEME_LABEL[choice]}. Klik untuk mengganti.`}
            title={`Tema: ${NEXT_THEME_LABEL[choice]}`}
          >
            {choice === "light" ? "☀" : choice === "dark" ? "☾" : "◐"}
          </button>
          <a className="button button--ghost" href={REPO_URL} rel="noreferrer noopener" target="_blank">
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
