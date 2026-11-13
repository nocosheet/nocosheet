import type { ColumnFiltersState } from "@tanstack/react-table";

import { type FilterTarget, parseCondition, serializeCondition } from "./filter-param";
import type { FilterCondition } from "./filters";

export function toColumnFilters(filters: FilterCondition[]): ColumnFiltersState {
  const grouped = new Map<string, string[]>();
  for (const filter of filters) {
    const conditions = grouped.get(filter.column) ?? [];
    conditions.push(serializeCondition(filter));
    grouped.set(filter.column, conditions);
  }
  return [...grouped].map(([id, value]) => ({ id, value }));
}

export function fromColumnFilters(
  state: ColumnFiltersState,
  targets: readonly FilterTarget[],
): FilterCondition[] {
  return state.flatMap((entry) => {
    const target = targets.find((item) => item.key === entry.id);
    if (!target) return [];
    const conditions = Array.isArray(entry.value) ? entry.value : [entry.value];
    return conditions.flatMap((text) => {
      if (typeof text !== "string") return [];
      const result = parseCondition(target, text);
      return result.ok ? [result.filter] : [];
    });
  });
}
