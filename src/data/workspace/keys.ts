export const workspaceKeys = {
  all: ["workspace"] as const,
  members: () => [...workspaceKeys.all, "members"] as const,
  tables: () => [...workspaceKeys.all, "tables"] as const,
  table: (id: number) => [...workspaceKeys.tables(), id] as const,
  mutation: (name: string) => [...workspaceKeys.all, name] as const,
};
