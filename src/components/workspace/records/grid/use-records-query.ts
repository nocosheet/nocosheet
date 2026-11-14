import { useState } from "react";

import { type QueryKey, type UseQueryOptions, useQueryClient } from "@tanstack/react-query";

import { useQueryStates } from "nuqs";

import { parseFilters, serializeFilters, targetsOfColumns } from "@/lib/records/filter-param";
import { recordsSearchParams, resolveRecordsQuery } from "@/lib/records/query";
import { sortKeyOf } from "@/lib/records/sort-param";

import type { ViewerColumn } from "../columns";

export function useRecordsQuery(columns: ViewerColumn[]) {
  const [urlQuery, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });

  const resolved = resolveRecordsQuery(urlQuery);
  const sortKey = sortKeyOf(
    columns.filter((column) => column.sortable).map((c) => ({ columnName: c.key, name: c.name })),
    resolved.sort,
  );

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
    sort: sortKey ? (nameByKey.get(sortKey) ?? null) : null,
    sortKey: sortKey ?? null,
  };

  const setQuery = (values: { [K in keyof typeof urlQuery]?: (typeof urlQuery)[K] | null }) =>
    setUrlQuery({ cursor: null, ...values });

  return {
    query: { ...query, dir: "next" as "next" | "prev" },
    setUrlQuery: setQuery,
    setCursor: setUrlQuery,
  };
}

type PageData = {
  nextCursor: string | null;
  prevCursor: string | null;
  startCursor: string | null;
};

export function useRecordsPaging<TData extends PageData, TKey extends QueryKey>({
  data,
  query,
  setCursor,
  optionsFor,
}: {
  data: TData | undefined;
  query: RecordsQuery;
  setCursor: SetRecordsCursor;
  optionsFor: (query: RecordsQuery) => UseQueryOptions<TData, Error, TData, TKey>;
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const next = () => {
    if (data?.nextCursor) void setCursor({ cursor: data.nextCursor }, { history: "push" });
  };

  const previous = async () => {
    if (!data?.prevCursor || loading) return;
    setLoading(true);
    try {
      const page = await queryClient.query(
        optionsFor({ ...query, cursor: data.prevCursor, dir: "prev" }),
      );
      queryClient.setQueryData<TData>(
        optionsFor({ ...query, cursor: page.startCursor, dir: "next" }).queryKey as QueryKey,
        page,
      );
      await setCursor({ cursor: page.startCursor }, { history: "push" });
    } finally {
      setLoading(false);
    }
  };

  return {
    hasPrevious: Boolean(data?.prevCursor),
    canNext: Boolean(data?.nextCursor),
    next,
    previous,
  };
}

export type RecordsPaging = ReturnType<typeof useRecordsPaging>;

export type RecordsQuery = ReturnType<typeof useRecordsQuery>["query"];
export type SetRecordsCursor = ReturnType<typeof useRecordsQuery>["setCursor"];
export type SetRecordsQuery = ReturnType<typeof useRecordsQuery>["setUrlQuery"];
