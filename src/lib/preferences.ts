import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";

import { z } from "zod";

const PREFERENCES_ID = "appearance";

export const ACCENTS = [
  { value: "default", label: "Default", swatch: "oklch(0.269 0 0)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.546 0.245 262.881)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.541 0.281 293.009)" },
  { value: "green", label: "Green", swatch: "oklch(0.627 0.194 149.214)" },
  { value: "orange", label: "Orange", swatch: "oklch(0.646 0.222 41.116)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.586 0.253 17.585)" },
] as const;

const ACCENT_VALUES = ACCENTS.map((accent) => accent.value) as [
  (typeof ACCENTS)[number]["value"],
  ...(typeof ACCENTS)[number]["value"][],
];

const preferencesSchema = z.object({
  id: z.literal(PREFERENCES_ID),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  accent: z.enum(ACCENT_VALUES).default("default"),
  sidebarDefault: z.enum(["expanded", "collapsed"]).default("expanded"),
});

export type Preferences = z.output<typeof preferencesSchema>;
export type Theme = Preferences["theme"];
export type Accent = Preferences["accent"];
export type SidebarDefault = Preferences["sidebarDefault"];

export const preferencesCollection = createCollection(
  localStorageCollectionOptions({
    id: "preferences",
    storageKey: "preferences",
    getKey: (preferences) => preferences.id,
    schema: preferencesSchema,
  }),
);

export const defaultPreferences = preferencesSchema.parse({ id: PREFERENCES_ID });

export const getPreferences = (): Preferences => ({
  ...defaultPreferences,
  ...preferencesCollection.get(PREFERENCES_ID),
});

export function setPreference<K extends Exclude<keyof Preferences, "id">>(
  key: K,
  value: Preferences[K],
) {
  if (preferencesCollection.has(PREFERENCES_ID)) {
    preferencesCollection.update(PREFERENCES_ID, (draft) => {
      draft[key] = value;
    });
  } else {
    preferencesCollection.insert({ id: PREFERENCES_ID, [key]: value });
  }
}

function applyPreferences({ theme, accent }: Preferences) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  if (accent === "default") delete root.dataset.accent;
  else root.dataset.accent = accent;
}

export async function initPreferences() {
  try {
    await preferencesCollection.preload();
  } catch {}
  applyPreferences(getPreferences());
  preferencesCollection.subscribeChanges(() => applyPreferences(getPreferences()));
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => applyPreferences(getPreferences()));
}
