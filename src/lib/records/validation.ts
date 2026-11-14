import { decodeCursor } from "./cursor";
import { conditionError, filterKind, isSortableFormat } from "./filters";
import type { TypedRecordsQuery } from "./query";

type QueryColumn = {
  columnName: string;
  name: string;
  format: string;
  isFilterable: boolean;
  isSortable: boolean;
};

const SYSTEM_SORTS = ["id", "created_at", "updated_at"];

export function checkRecordsQuery(columns: QueryColumn[], query: TypedRecordsQuery) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));

  for (const condition of query.filters) {
    const column = byName.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    if (!column || !kind || !column.isFilterable) return `"${condition.column}" can't be filtered.`;
    const error = conditionError(kind, condition);
    if (error) return `${column.name}: ${error}`;
  }

  if (query.sort && !SYSTEM_SORTS.includes(query.sort)) {
    const column = byName.get(query.sort);
    if (!column || !column.isSortable || !isSortableFormat(column.format))
      return `"${query.sort}" can't be sorted.`;
  }

  if (query.cursor && !decodeCursor(query.cursor)) return "The page cursor is invalid.";

  return undefined;
}
