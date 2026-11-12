import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  readPreferences,
  STORAGE_KEY,
  writePreferences,
  type Preferences,
} from "@/lib/preferences";

let current: Preferences | null = null;
const listeners = new Set<() => void>();

function snapshot() {
  current ??= readPreferences();
  return current;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    current = readPreferences();
    applyPreferences(current);
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const readSidebarDefaultOpen = () => snapshot().sidebar === "expanded";

export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFERENCES);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      current = { ...snapshot(), [key]: value };
      writePreferences(current);
      applyPreferences(current);
      emit();
    },
    [],
  );

  useEffect(() => {
    if (preferences.theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPreferences(snapshot());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preferences.theme]);

  return { preferences, setPreference };
}
