import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PREFERENCE_KEYS } from "@/lib/browser/storage";
import { useLocalStoragePreference } from "@/hooks/useLocalStoragePreference";

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const isThemeChoice = (value: string): value is ThemeChoice =>
  value === "light" || value === "dark" || value === "system";

interface ThemeContextValue {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  cycle: () => void;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const prefersDark = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useLocalStoragePreference<ThemeChoice>(
    PREFERENCE_KEYS.theme,
    "system",
    isThemeChoice,
  );
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  const resolved: ResolvedTheme = choice === "system" ? (systemDark ? "dark" : "light") : choice;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);

  const cycle = useCallback(() => {
    setChoice(choice === "light" ? "dark" : choice === "dark" ? "system" : "light");
  }, [choice, setChoice]);

  const value = useMemo(
    () => ({ choice, resolved, cycle, setChoice }),
    [choice, resolved, cycle, setChoice],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return context;
}
