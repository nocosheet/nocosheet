import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export type SidebarTable = {
  id: number;
  name: string;
  icon: string | null;
  groupName: string | null;
  favorite: boolean;
  updatedAt: string;
};

export type SidebarGroup = { name: string | null; tables: SidebarTable[] };

export type SidebarData = { favorites: SidebarTable[]; groups: SidebarGroup[] };

type SidebarRow = {
  id: number;
  name: string;
  icon: string | null;
  groupName: string | null;
  updatedAt: string;
  favoritedAt: string | null;
};

function buildSidebar(rows: SidebarRow[]): SidebarData {
  const tables = new Map<number, SidebarTable>();
  const grouped = new Map<string | null, SidebarTable[]>();

  for (const row of rows) {
    const table: SidebarTable = {
      id: row.id,
      name: row.name,
      icon: row.icon,
      groupName: row.groupName,
      favorite: row.favoritedAt !== null,
      updatedAt: row.updatedAt,
    };
    tables.set(table.id, table);
    const bucket = grouped.get(table.groupName);
    if (bucket) bucket.push(table);
    else grouped.set(table.groupName, [table]);
  }

  const groups = [...grouped.entries()]
    .map(([name, items]) => ({ name, tables: items }))
    .sort((a, b) => {
      if (a.name === null) return -1;
      if (b.name === null) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  const favorites = rows
    .filter((row) => row.favoritedAt !== null)
    .sort((a, b) => Date.parse(a.favoritedAt!) - Date.parse(b.favoritedAt!))
    .map((row) => tables.get(row.id)!);

  return { favorites, groups };
}

export const sidebarQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.sidebar(),
    queryFn: () => unwrapFetch(fetch("/api/workspaces/:workspace/sidebar", { params: { workspace } })),
    select: buildSidebar,
    staleTime: 30_000,
  });
