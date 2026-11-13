import { quoteIdent } from "../tables/naming";
import type { Column } from "../tables/repository";
import type { FilterCondition, FilterKind } from "./filters";

export type Bind = (value: string | number) => string;

const ref = (name: string) => `t.${quoteIdent(name)}`;

const DAY_MS = 86_400_000;

function dateText(column: Column) {
  const target = ref(column.columnName);
  if (column.format === "datetime_tz") return `date(${target})`;
  return target;
}

function dateCondition(column: Column, op: string, text: string, bind: Bind) {
  if (column.format !== "datetime") {
    const target = dateText(column);
    const symbol = { eq: "=", before: "<", after: ">", on_or_before: "<=", on_or_after: ">=" }[op];
    return `${target} ${symbol} ${bind(text)}`;
  }

  const target = ref(column.columnName);
  const start = Date.parse(`${text}T00:00:00Z`);
  switch (op) {
    case "eq":
      return `(${target} >= ${bind(start)} and ${target} < ${bind(start + DAY_MS)})`;
    case "before":
      return `${target} < ${bind(start)}`;
    case "after":
      return `${target} >= ${bind(start + DAY_MS)}`;
    case "on_or_before":
      return `${target} < ${bind(start + DAY_MS)}`;
    default:
      return `${target} >= ${bind(start)}`;
  }
}

export function conditionText(
  column: Column,
  kind: FilterKind,
  condition: FilterCondition,
  bind: Bind,
): string {
  const target = ref(column.columnName);
  const value = condition.value;
  const text = typeof value === "string" ? value : "";
  const list = Array.isArray(value) ? value : [];
  const items = () => list.map((item) => bind(String(item))).join(", ");

  switch (condition.op) {
    case "is_empty":
      return kind === "multi_select"
        ? `(${target} is null or ${target} = '[]')`
        : kind === "text" || kind === "single_select"
          ? `(${target} is null or ${target} = '')`
          : `${target} is null`;
    case "is_not_empty":
      return kind === "multi_select"
        ? `(${target} is not null and ${target} != '[]')`
        : kind === "text" || kind === "single_select"
          ? `(${target} is not null and ${target} != '')`
          : `${target} is not null`;
    case "equals":
      return `${target} = ${bind(text)} collate nocase`;
    case "not_equals":
      return `(${target} is null or ${target} != ${bind(text)} collate nocase)`;
    case "eq":
      return kind === "date"
        ? dateCondition(column, "eq", text, bind)
        : `${target} = ${bind(Number(value))}`;
    case "neq":
      return `(${target} is null or ${target} != ${bind(Number(value))})`;
    case "gt":
      return `${target} > ${bind(Number(value))}`;
    case "gte":
      return `${target} >= ${bind(Number(value))}`;
    case "lt":
      return `${target} < ${bind(Number(value))}`;
    case "lte":
      return `${target} <= ${bind(Number(value))}`;
    case "before":
    case "after":
    case "on_or_before":
    case "on_or_after":
      return dateCondition(column, condition.op, text, bind);
    case "is":
      if (kind === "checkbox") return `coalesce(${target}, 0) = ${bind(value === true ? 1 : 0)}`;
      return `${target} = ${bind(text)}`;
    case "is_not":
      return `(${target} is null or ${target} != ${bind(text)})`;
    case "is_any_of":
      return `${target} in (${items()})`;
    case "has_any_of":
      return `exists (select 1 from json_each(${target}) where value in (${items()}))`;
  }
}
