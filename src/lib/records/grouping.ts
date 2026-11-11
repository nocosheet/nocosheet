export const GROUPABLE_FORMATS = ["single_select", "checkbox", "relation"] as const;
export const GROUPABLE_SYSTEM_KEYS = ["created_by", "updated_by"] as const;

export const isGroupableFormat = (format: string) =>
  (GROUPABLE_FORMATS as readonly string[]).includes(format);

export const isGroupableColumn = (column: { format: string; isFilterable: boolean }) =>
  column.isFilterable && isGroupableFormat(column.format);

export const isGroupableSystemKey = (key: string) =>
  (GROUPABLE_SYSTEM_KEYS as readonly string[]).includes(key);

export function groupKeyOf(format: string, value: unknown): string {
  if (format === "single_select") return typeof value === "string" ? value : "";
  if (format === "checkbox") return value === true ? "1" : "0";
  if (value && typeof value === "object" && "id" in value)
    return String((value as { id: unknown }).id);
  return "";
}
