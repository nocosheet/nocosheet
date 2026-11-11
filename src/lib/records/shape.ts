type ShapeColumn = { columnName: string; format: string };

const parse = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export function shapeRecord(row: Record<string, unknown>, columns: ShapeColumn[]) {
  const record: Record<string, unknown> = { id: row.id };
  for (const key of ["created_at", "updated_at"]) if (key in row) record[key] = row[key];
  for (const key of ["created_by", "updated_by"])
    if (key in row)
      record[key] = row[key] ? { id: row[key], label: row[`${key}__label`] ?? null } : null;
  for (const column of columns) {
    const value = row[column.columnName];
    if (column.format === "checkbox")
      record[column.columnName] = value === null ? null : value === 1;
    else if (["multi_select", "json", "file", "image"].includes(column.format))
      record[column.columnName] = parse(value);
    else if (column.format === "relation")
      record[column.columnName] =
        value === null || value === undefined
          ? null
          : { id: value, label: row[`${column.columnName}__label`] ?? null };
    else record[column.columnName] = value ?? null;
  }
  return record;
}
