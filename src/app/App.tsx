import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { ToolHost } from "@/app/ToolHost";
import { useHashRoute } from "@/hooks/useHashRoute";
import { HomePage } from "@/features/home/HomePage";
import { CommunityPage } from "@/features/community/CommunityPage";
import { PrivacyPage } from "@/features/privacy/PrivacyPage";
import { NotFoundPage } from "@/features/not-found/NotFoundPage";
import { getTool } from "@/registry/tools";

const SITE = "Developer Utility Hub";

export function App() {
  const route = useHashRoute();

  useEffect(() => {
    const toolName = route.name === "tool" ? getTool(route.id ?? "")?.name : undefined;
    const titles: Record<string, string> = {
      home: SITE,
      community: `Community · ${SITE}`,
      privacy: `Privasi · ${SITE}`,
      "not-found": `Halaman tidak ditemukan · ${SITE}`,
    };
    document.title = toolName ? `${toolName} · ${SITE}` : titles[route.name] ?? SITE;
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>("[data-route-heading]");
    heading?.focus();
  }, [route]);

  const page = (() => {
    switch (route.name) {
      case "home":
        return <HomePage initialCategory={route.category} />;
      case "community":
        return <CommunityPage />;
      case "privacy":
        return <PrivacyPage />;
      case "tool":
        return <ToolHost id={route.id ?? ""} />;
      default:
        return <NotFoundPage />;
    }
  })();

  return (
    <AppShell>
      <ErrorBoundary key={`${route.name}-${route.id ?? route.category ?? ""}`}>{page}</ErrorBoundary>
    </AppShell>
  );
}
