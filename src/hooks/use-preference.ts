import { useLiveQuery } from "@tanstack/react-db";

import {
  defaultPreferences,
  setPreference,
  preferencesCollection,
  type Preferences,
} from "@/lib/preferences";

export function usePreference<K extends Exclude<keyof Preferences, "id">>(key: K) {
  const { data } = useLiveQuery((query) => query.from({ preferences: preferencesCollection }));
  const value = (data[0]?.[key] ?? defaultPreferences[key]) as Preferences[K];

  return [value, (next: Preferences[K]) => setPreference(key, next)] as const;
}
