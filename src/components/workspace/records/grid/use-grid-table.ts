import { useMemo } from "react";

import {
  type ColumnDef,
  functionalUpdate,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";

import { dataTableFeatures } from "@/components/shared/data-table/features";
import { fromColumnFilters, toColumnFilters } from "@/lib/records/column-filters";
import { serializeFilters, targetsOfColumns } from "@/lib/records/filter-param";

import type { ViewerColumn } from "../columns";
import type { ViewerRow } from "../records-grid";
import type { RecordsPaging, RecordsQuery, SetRecordsQuery } from "./use-records-query";

export function useGridTable({
  columns,
  rows,
  query,
  setQuery,
  paging,
}: {
  columns: ViewerColumn[];
  rows: ViewerRow[];
  query: RecordsQuery;
  setQuery: SetRecordsQuery;
  paging: RecordsPaging;
}) {
  const columnDefs = useMemo<ColumnDef<typeof dataTableFeatures, ViewerRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: column.name,
        meta: { label: column.name },
        enableSorting: column.sortable,
        enableColumnFilter: column.filterable,
        enableHiding: !column.title,
      })),
    [columns],
  );
  const initialVisibility = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.key, !column.hiddenByDefault])),
    [columns],
  );

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: paging.hasPrevious ? 1 : 0, pageSize: query.pageSize }),
    [paging.hasPrevious, query.pageSize],
  );
  const targets = useMemo(
    () =>
      targetsOfColumns(
        columns
          .filter((column) => column.filterable)
          .map((column) => ({ columnName: column.key, name: column.name, format: column.format })),
      ),
    [columns],
  );
  const filtersKey = JSON.stringify(query.filters);
  const columnFilters = useMemo(() => toColumnFilters(query.filters), [filtersKey]);

  const sorting = useMemo<SortingState>(
    () => (query.sort ? [{ id: query.sort, desc: query.order === "desc" }] : []),
    [query.sort, query.order],
  );

  return useTable(
    {
      features: dataTableFeatures,
      columns: columnDefs,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      autoResetPageIndex: false,
      enableMultiSort: false,
      enableRowSelection: true,
      pageCount: (paging.hasPrevious ? 1 : 0) + (paging.canNext ? 2 : 1),
      initialState: { columnVisibility: initialVisibility },
      state: {
        pagination,
        sorting,
        columnFilters,
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, pagination);
        if (next.pageSize !== pagination.pageSize) {
          void setQuery({ pageSize: next.pageSize as RecordsQuery["pageSize"] });
          return;
        }
        if (next.pageIndex < pagination.pageIndex) void paging.previous();
        else if (next.pageIndex > pagination.pageIndex) paging.next();
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, sorting);
        const sort = next?.id ?? null;
        const order = next?.desc ? "desc" : "asc";
        if (sort === query.sort && (sort === null || order === query.order)) return;
        void setQuery({ sort, order });
      },
      onColumnFiltersChange: (updater) => {
        const next = fromColumnFilters(functionalUpdate(updater, columnFilters), targets);
        if (JSON.stringify(next) === filtersKey) return;
        const names = new Map(columns.map((column) => [column.key, column.name]));
        void setQuery({
          filter: next.length ? serializeFilters(next, (key) => names.get(key) ?? key) : null,
        });
      },
      onGlobalFilterChange: (updater) => {
        const next = String(functionalUpdate(updater, query.q) ?? "");
        if (next === query.q) return;
        void setQuery({ q: next });
      },
    },
    (state) => ({
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      pagination: state.pagination,
      columnFilters: state.columnFilters,
    }),
  );
}

export type GridTable = ReturnType<typeof useGridTable>;
