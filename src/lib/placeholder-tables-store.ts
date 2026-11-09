import { useSyncExternalStore } from "react";

import { PLACEHOLDER_TABLES, type PlaceholderTable } from "./sidebar-placeholders";

/**
 * In-memory stand-in for the tables API so the sidebar menu actions (favorite, delete) work in
 * the demo. Resets on reload; swap for real queries and mutations once tables exist.
 */
let tables: PlaceholderTable[] = PLACEHOLDER_TABLES;
const listeners = new Set<() => void>();

function update(next: PlaceholderTable[]) {
  tables = next;
  listeners.forEach((listener) => listener());
}

export const placeholderTables = {
  toggleFavorite: (id: string) =>
    update(tables.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t))),
  remove: (id: string) => update(tables.filter((t) => t.id !== id)),
};

export function usePlaceholderTables() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => tables,
    () => PLACEHOLDER_TABLES,
  );
}
