import { useEffect, useState, type ComponentType } from "react";
import { getTool } from "@/registry/tools";
import { NotFoundPage } from "@/features/not-found/NotFoundPage";

const cache = new Map<string, ComponentType>();

/** Memuat chunk tool sesuai registry; fallback ke 404 bila id tidak dikenal/gagal. */
export function ToolHost({ id }: { id: string }) {
  const [Component, setComponent] = useState<ComponentType | null>(() => cache.get(id) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);

    const cached = cache.get(id);
    if (cached) {
      setComponent(() => cached);
      return;
    }

    setComponent(null);
    const meta = getTool(id);
    if (!meta?.load) {
      setFailed(true);
      return;
    }

    meta
      .load()
      .then((module) => {
        if (!active) return;
        cache.set(id, module.default);
        setComponent(() => module.default);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (failed) return <NotFoundPage />;
  if (!Component) return <p role="status">Memuat tool…</p>;
  return <Component />;
}
