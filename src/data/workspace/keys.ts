export const workspaceKeys = {
  all: ["workspace"] as const,
  members: () => [...workspaceKeys.all, "members"] as const,
  access: () => [...workspaceKeys.all, "access"] as const,
  roles: () => [...workspaceKeys.all, "roles"] as const,
  role: (id: number) => [...workspaceKeys.roles(), id] as const,
  roleAssignments: () => [...workspaceKeys.roles(), "assignments"] as const,
  tables: () => [...workspaceKeys.all, "tables"] as const,
  records: (id: number, query: object) => [...workspaceKeys.table(id), "records", query] as const,
  record: (id: number, recordId: string) =>
    [...workspaceKeys.table(id), "record", recordId] as const,
  recordsExport: (id: number) => [...workspaceKeys.table(id), "export"] as const,
  trash: (id: number) => [...workspaceKeys.table(id), "trash"] as const,
  trashList: (id: number, query: object) => [...workspaceKeys.trash(id), "list", query] as const,
  trashEntry: (id: number, entryId: number) =>
    [...workspaceKeys.trash(id), "entry", entryId] as const,
  restoreError: (id: number, entryId: number) =>
    [...workspaceKeys.trashEntry(id, entryId), "error"] as const,
  recordOptions: (id: number, term: string) =>
    [...workspaceKeys.table(id), "options", term] as const,
  sidebar: () => [...workspaceKeys.tables(), "sidebar"] as const,
  tablesTrash: (query?: object) =>
    (query
      ? [...workspaceKeys.tables(), "trash", query]
      : [...workspaceKeys.tables(), "trash"]) as readonly unknown[],
  tableList: (query: object) => [...workspaceKeys.tables(), "list", query] as const,
  table: (id: number) => [...workspaceKeys.tables(), id] as const,
  mutation: (name: string) => [...workspaceKeys.all, name] as const,
};
