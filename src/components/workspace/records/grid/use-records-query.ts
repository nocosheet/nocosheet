import { useQueryStates } from "nuqs";

import { recordsSearchParams, resolveRecordsQuery } from "@/lib/records/query";

import type { ViewerColumn } from "../columns";

export function useRecordsQuery(columns: ViewerColumn[]) {
  const [urlQuery, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });

  const resolved = resolveRecordsQuery(urlQuery);
  const sortable = new Set(columns.filter((column) => column.sortable).map((c) => c.key));
  const filterable = new Set(columns.filter((column) => column.filterable).map((c) => c.key));
  const groupable = new Set(columns.filter((column) => column.groupable).map((c) => c.key));

  const query = {
    ...resolved,
    group: resolved.group && groupable.has(resolved.group) ? resolved.group : null,
    sort: resolved.sort && sortable.has(resolved.sort) ? resolved.sort : null,
    filters: resolved.filters.filter((filter) => filterable.has(filter.column)),
  };

  return { query, setUrlQuery };
}

export type RecordsQuery = ReturnType<typeof useRecordsQuery>["query"];
export type SetRecordsQuery = ReturnType<typeof useRecordsQuery>["setUrlQuery"];
