import { ACCENTS, type Accent } from "@/lib/accents";

export const THEMES = ["system", "light", "dark"] as const;
export const FONTS = ["sans", "mono"] as const;
export const RADII = ["default", "none"] as const;
export const SIDEBARS = ["expanded", "collapsed"] as const;

export type Theme = (typeof THEMES)[number];
export type Font = (typeof FONTS)[number];
export type Radius = (typeof RADII)[number];
export type SidebarDefault = (typeof SIDEBARS)[number];

export type Preferences = {
  theme: Theme;
  accent: Accent;
  font: Font;
  radius: Radius;
  sidebar: SidebarDefault;
};

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  accent: "default",
  font: "sans",
  radius: "default",
  sidebar: "expanded",
};

export const STORAGE_KEY = "preferences";

const LEGACY_KEYS = { theme: "theme", accent: "accent", sidebar: "sidebar-default" } as const;

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  allowed.find((item) => item === value) ?? fallback;

function normalize(raw: Record<string, unknown>): Preferences {
  return {
    theme: pick(THEMES, raw.theme, DEFAULT_PREFERENCES.theme),
    accent: pick(
      ACCENTS.map((accent) => accent.value),
      raw.accent,
      DEFAULT_PREFERENCES.accent,
    ),
    font: pick(FONTS, raw.font, DEFAULT_PREFERENCES.font),
    radius: pick(RADII, raw.radius, DEFAULT_PREFERENCES.radius),
    sidebar: pick(SIDEBARS, raw.sidebar, DEFAULT_PREFERENCES.sidebar),
  };
}

export function readPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalize(JSON.parse(stored));
    const legacy = {
      theme: localStorage.getItem(LEGACY_KEYS.theme),
      accent: localStorage.getItem(LEGACY_KEYS.accent),
      sidebar: localStorage.getItem(LEGACY_KEYS.sidebar),
    };
    return normalize(legacy);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    for (const key of Object.values(LEGACY_KEYS)) localStorage.removeItem(key);
  } catch {}
}

export function applyPreferences({ theme, accent, font, radius }: Preferences) {
  const root = document.documentElement;
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  const set = (name: string, value: string | null) => {
    if (value) root.dataset[name] = value;
    else delete root.dataset[name];
  };
  set("accent", accent === "default" ? null : accent);
  set("font", font === "sans" ? null : font);
  set("radius", radius === "default" ? null : radius);
}
