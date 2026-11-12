/**
 * Hash router minimal (ADR-0006 §4): hash → Route.
 * URL tidak pernah memuat isi input (PRD §3).
 */

export type RouteName =
  | "home"
  | "tool"
  | "community"
  | "privacy"
  | "not-found";

export interface Route {
  name: RouteName;
  id?: string;
  /** Filter kategori di beranda, mis. `#/?kategori=diff`. Bukan data pengguna. */
  category?: string;
}

const KNOWN_SIMPLE: Record<string, RouteName> = {
  "": "home",
  "/": "home",
  "/tools": "home",
  "/community": "community",
  "/privacy": "privacy",
};

export function parseHash(hash: string): Route {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const [pathPart = "", queryPart = ""] = raw.split("?");
  const path = pathPart.trim();

  const simple = KNOWN_SIMPLE[path];
  if (simple) {
    if (simple === "home" && queryPart) {
      const params = new URLSearchParams(queryPart);
      const category = params.get("kategori");
      return category ? { name: "home", category } : { name: "home" };
    }
    return { name: simple };
  }

  const toolMatch = /^\/tools\/([a-z0-9-]+)\/?$/.exec(path);
  if (toolMatch?.[1]) {
    return { name: "tool", id: toolMatch[1] };
  }

  return { name: "not-found" };
}

export function toHash(route: Route): string {
  switch (route.name) {
    case "home":
      return route.category ? `#/?kategori=${encodeURIComponent(route.category)}` : "#/";
    case "tool":
      return `#/tools/${route.id ?? ""}`;
    case "community":
      return "#/community";
    case "privacy":
      return "#/privacy";
    default:
      return "#/";
  }
}
