import { quoteIdent } from "../tables/naming";
import type { Column } from "../tables/repository";
import type { FilterCondition, FilterKind } from "./filters";

export type Bind = (value: string | number) => string;

const ref = (name: string) => `t.${quoteIdent(name)}`;
const like = (value: string) => `%${value.replaceAll(/[\\%_]/g, "\\$&")}%`;

function dateText(column: Column) {
  const target = ref(column.columnName);
  if (column.format === "datetime") return `date(${target} / 1000, 'unixepoch')`;
  if (column.format === "datetime_tz") return `date(${target})`;
  return target;
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
    case "contains":
      return `${target} like ${bind(like(text))} escape '\\'`;
    case "not_contains":
      return `(${target} is null or ${target} not like ${bind(like(text))} escape '\\')`;
    case "starts_with":
      return `${target} like ${bind(`${like(text).slice(1, -1)}%`)} escape '\\'`;
    case "ends_with":
      return `${target} like ${bind(`%${like(text).slice(1, -1)}`)} escape '\\'`;
    case "equals":
      return `${target} = ${bind(text)} collate nocase`;
    case "not_equals":
      return `(${target} is null or ${target} != ${bind(text)} collate nocase)`;
    case "eq":
      return kind === "date"
        ? `${dateText(column)} = ${bind(text)}`
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
      return `${dateText(column)} < ${bind(text)}`;
    case "after":
      return `${dateText(column)} > ${bind(text)}`;
    case "on_or_before":
      return `${dateText(column)} <= ${bind(text)}`;
    case "on_or_after":
      return `${dateText(column)} >= ${bind(text)}`;
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
