import { useCallback, useState } from "react";
import { readPreference, writePreference, type PreferenceKey } from "@/lib/browser/storage";

/** Preferensi yang persisten; hanya untuk nilai tampilan/opsi (PRD §3). */
export function useLocalStoragePreference<T extends string>(
  key: PreferenceKey,
  fallback: T,
  isValid: (value: string) => value is T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = readPreference(key);
    return stored !== null && isValid(stored) ? stored : fallback;
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      writePreference(key, next);
    },
    [key],
  );

  return [value, update];
}
