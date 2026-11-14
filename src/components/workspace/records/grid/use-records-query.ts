import { useState } from "react";

import { useQueryStates } from "nuqs";

import { parseFilters, serializeFilters, targetsOfColumns } from "@/lib/records/filter-param";
import { recordsSearchParams, resolveRecordsQuery } from "@/lib/records/query";

import type { ViewerColumn } from "../columns";

export function useRecordsQuery(columns: ViewerColumn[]) {
  const [urlQuery, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });

  const resolved = resolveRecordsQuery(urlQuery);
  const sortable = new Set(columns.filter((column) => column.sortable).map((c) => c.key));

  const nameByKey = new Map(columns.map((column) => [column.key, column.name]));
  const { filters } = parseFilters(
    resolved.filter,
    targetsOfColumns(
      columns
        .filter((column) => column.filterable)
        .map((column) => ({ columnName: column.key, name: column.name, format: column.format })),
    ),
  );

  const query = {
    ...resolved,
    filters,
    filter: serializeFilters(filters, (key) => nameByKey.get(key) ?? key),
    sort: resolved.sort && sortable.has(resolved.sort) ? resolved.sort : null,
  };

  const signature = JSON.stringify(query);
  const [trail, setTrail] = useState<{ signature: string; cursors: (string | null)[] }>({
    signature,
    cursors: [null],
  });
  const cursors = trail.signature === signature ? trail.cursors : [null];
  const pageIndex = cursors.length - 1;

  const goTo = (index: number) =>
    setTrail({ signature, cursors: cursors.slice(0, Math.max(0, index) + 1) });

  const paging = {
    pageIndex,
    rowOffset: pageIndex * query.pageSize,
    canPrevious: pageIndex > 0,
    next: (cursor: string) => setTrail({ signature, cursors: [...cursors, cursor] }),
    previous: () => goTo(pageIndex - 1),
    goTo,
  };

  return { query: { ...query, cursor: cursors.at(-1) ?? null }, setUrlQuery, paging };
}

export type RecordsPaging = ReturnType<typeof useRecordsQuery>["paging"];

export type RecordsQuery = ReturnType<typeof useRecordsQuery>["query"];
export type SetRecordsQuery = ReturnType<typeof useRecordsQuery>["setUrlQuery"];
