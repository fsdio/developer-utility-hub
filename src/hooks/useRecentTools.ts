import { useCallback, useMemo } from "react";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";

export const RECENT_LIMIT = 6;

/** Hanya id tool yang valid yang disimpan; entri rusak/asing diabaikan. */
const parseRecent = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
};

/**
 * Riwayat tool yang terakhir dibuka. Sengaja hanya menyimpan id tool publik,
 * tanpa isi input, agar tetap patuh pada janji privasi (PRD §3).
 */
export function useRecentTools() {
  const [raw, setRaw] = useLocalStoragePreference<string>(
    PREFERENCE_KEYS.recentTools,
    "[]",
    (value): value is string => typeof value === "string",
  );

  const recent = useMemo(() => parseRecent(raw), [raw]);

  const record = useCallback(
    (id: string) => {
      const next = [id, ...parseRecent(raw).filter((item) => item !== id)].slice(0, RECENT_LIMIT);
      setRaw(JSON.stringify(next));
    },
    [raw, setRaw],
  );

  return { recent, record };
}
