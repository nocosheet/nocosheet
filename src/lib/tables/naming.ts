export const RESERVED_COLUMN_NAMES = ["id", "created_at", "updated_at", "created_by", "updated_by"];

export function toSlug(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[0-9]/.test(slug) ? `_${slug}` : slug;
}

export const toTableName = toSlug;
export const toColumnName = toSlug;

export const physicalTableName = (workspace: string, tableName: string) =>
  `${workspace}__t_${tableName}`;

export const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;
