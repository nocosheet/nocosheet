import { useMemo } from "react";

import { type ColumnDef, functionalUpdate, useTable } from "@tanstack/react-table";

import { dataTableFeatures } from "@/components/shared/data-table/features";

import type { ViewerColumn } from "../columns";
import type { ViewerRow } from "../records-grid";
import type { RecordsQuery, SetRecordsQuery } from "./use-records-query";

export function useGridTable({
  columns,
  rows,
  total,
  query,
  setQuery,
}: {
  columns: ViewerColumn[];
  rows: ViewerRow[];
  total: number;
  query: RecordsQuery;
  setQuery: SetRecordsQuery;
}) {
  const columnDefs = useMemo<ColumnDef<typeof dataTableFeatures, ViewerRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: column.name,
        meta: { label: column.name },
        enableSorting: column.sortable,
        enableHiding: !column.title,
      })),
    [columns],
  );
  const initialVisibility = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.key, !column.hiddenByDefault])),
    [columns],
  );

  const sorting = query.sort ? [{ id: query.sort, desc: query.order === "desc" }] : [];

  return useTable(
    {
      features: dataTableFeatures,
      columns: columnDefs,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      enableMultiSort: false,
      enableRowSelection: true,
      rowCount: total,
      initialState: { columnVisibility: initialVisibility },
      state: {
        pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
        sorting,
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, {
          pageIndex: query.page - 1,
          pageSize: query.pageSize,
        });
        void setQuery({ page: next.pageIndex + 1 });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, sorting);
        void setQuery({ sort: next?.id ?? null, order: next?.desc ? "desc" : "asc", page: 1 });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        void setQuery({ q: next, page: 1 });
      },
    },
    (state) => ({ columnVisibility: state.columnVisibility, rowSelection: state.rowSelection }),
  );
}

export type GridTable = ReturnType<typeof useGridTable>;
