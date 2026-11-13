import { conditionText } from "../records/condition";
import { type FilterCondition, filterKind } from "../records/filters";
import type { Column } from "../tables/repository";

export class ViewWhereError extends Error {}

function literal(value: string | number) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new ViewWhereError("Enter a number");
    return String(value);
  }
  return `'${value.replaceAll("'", "''")}'`;
}

export function buildViewWhere(columns: Column[], filters: FilterCondition[]) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  const conditions = filters.map((condition) => {
    const column = byName.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    if (!column || !kind) throw new ViewWhereError(`"${condition.column}" can't be filtered.`);
    return conditionText(column, kind, condition, literal);
  });
  return conditions.length ? `(${conditions.join(" and ")})` : null;
}
