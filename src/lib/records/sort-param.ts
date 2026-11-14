export const SYSTEM_SORTS = [
  { columnName: "id", name: "Id" },
  { columnName: "created_at", name: "Created at" },
  { columnName: "updated_at", name: "Updated at" },
] as const;

export const SYSTEM_SORT_KEYS: readonly string[] = SYSTEM_SORTS.map((sort) => sort.columnName);

export const systemSortName = (columnName: (typeof SYSTEM_SORTS)[number]["columnName"]) =>
  SYSTEM_SORTS.find((sort) => sort.columnName === columnName)!.name;

export function sortKeyOf(
  columns: { columnName: string; name: string }[],
  wire: string | null,
): string | null | undefined {
  if (wire === null || wire === "") return null;
  const target = wire.trim().toLowerCase();
  const match = [...columns, ...SYSTEM_SORTS].find((item) => item.name.toLowerCase() === target);
  return match?.columnName;
}

export function sortNameOf(
  columns: { columnName: string; name: string }[],
  key: string | null,
): string | null {
  if (key === null) return null;
  return [...columns, ...SYSTEM_SORTS].find((item) => item.columnName === key)?.name ?? null;
}
