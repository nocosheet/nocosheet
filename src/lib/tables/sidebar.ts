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
  updatedAt: Date;
  favoritedAt: Date | null;
};

export function buildSidebar(rows: SidebarRow[]): SidebarData {
  const tables = rows.map((row) => ({
    table: {
      id: row.id,
      name: row.name,
      icon: row.icon,
      groupName: row.groupName,
      favorite: row.favoritedAt !== null,
      updatedAt: row.updatedAt.toISOString(),
    } satisfies SidebarTable,
    favoritedAt: row.favoritedAt,
  }));

  const grouped = new Map<string | null, SidebarTable[]>();
  for (const { table } of tables) {
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

  const favorites = tables
    .filter(({ favoritedAt }) => favoritedAt !== null)
    .sort((a, b) => a.favoritedAt!.getTime() - b.favoritedAt!.getTime())
    .map(({ table }) => table);

  return { favorites, groups };
}
