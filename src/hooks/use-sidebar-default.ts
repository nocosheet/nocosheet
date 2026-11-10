import { useCallback, useState } from "react";

export type SidebarDefault = "expanded" | "collapsed";

const STORAGE_KEY = "sidebar-default";

function readSidebarDefault(): SidebarDefault {
  try {
    return localStorage.getItem(STORAGE_KEY) === "collapsed" ? "collapsed" : "expanded";
  } catch {
    return "expanded";
  }
}

export const readSidebarDefaultOpen = () => readSidebarDefault() === "expanded";

export function useSidebarDefault() {
  const [sidebarDefault, setSidebarDefaultState] = useState<SidebarDefault>(readSidebarDefault);

  const setSidebarDefault = useCallback((next: SidebarDefault) => {
    try {
      if (next === "collapsed") localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setSidebarDefaultState(next);
  }, []);

  return { sidebarDefault, setSidebarDefault };
}
