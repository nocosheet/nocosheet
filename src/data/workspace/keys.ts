export const workspaceKeys = {
  all: ["workspace"] as const,
  members: () => [...workspaceKeys.all, "members"] as const,
  tables: () => [...workspaceKeys.all, "tables"] as const,
  sidebar: () => [...workspaceKeys.tables(), "sidebar"] as const,
  tableList: (query: object) => [...workspaceKeys.tables(), "list", query] as const,
  table: (id: number) => [...workspaceKeys.tables(), id] as const,
  mutation: (name: string) => [...workspaceKeys.all, name] as const,
};
