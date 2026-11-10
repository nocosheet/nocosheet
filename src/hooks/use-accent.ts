import { useCallback, useState } from "react";

import { ACCENTS, type Accent } from "@/lib/accents";

const STORAGE_KEY = "accent";

function readAccent(): Accent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ACCENTS.find((accent) => accent.value === stored)?.value ?? "default";
  } catch {
    return "default";
  }
}

export function useAccent() {
  const [accent, setAccentState] = useState<Accent>(readAccent);

  const setAccent = useCallback((next: Accent) => {
    try {
      if (next === "default") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setAccentState(next);
    if (next === "default") delete document.documentElement.dataset.accent;
    else document.documentElement.dataset.accent = next;
  }, []);

  return { accent, setAccent };
}
