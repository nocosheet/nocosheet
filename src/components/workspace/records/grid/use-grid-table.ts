import { useMemo } from "react";

import {
  type ColumnDef,
  functionalUpdate,
  type PaginationState,
  useTable,
} from "@tanstack/react-table";

import { dataTableFeatures } from "@/components/shared/data-table/features";

import type { ViewerColumn } from "../columns";
import type { ViewerRow } from "../records-grid";
import type { RecordsPaging, RecordsQuery, SetRecordsQuery } from "./use-records-query";

export function useGridTable({
  columns,
  rows,
  query,
  setQuery,
  paging,
  hasMore,
  nextCursor,
}: {
  columns: ViewerColumn[];
  rows: ViewerRow[];
  query: RecordsQuery;
  setQuery: SetRecordsQuery;
  paging: RecordsPaging;
  hasMore: boolean;
  nextCursor: string | null;
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

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: paging.pageIndex, pageSize: query.pageSize }),
    [paging.pageIndex, query.pageSize],
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
      autoResetPageIndex: false,
      enableMultiSort: false,
      enableRowSelection: true,
      pageCount: paging.pageIndex + (hasMore ? 2 : 1),
      initialState: { columnVisibility: initialVisibility },
      state: {
        pagination,
        sorting,
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, pagination);
        if (next.pageSize !== pagination.pageSize) {
          void setQuery({ pageSize: next.pageSize as RecordsQuery["pageSize"] });
          return;
        }
        if (next.pageIndex < pagination.pageIndex) paging.goTo(next.pageIndex);
        else if (next.pageIndex === pagination.pageIndex + 1 && nextCursor) paging.next(nextCursor);
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, sorting);
        void setQuery({ sort: next?.id ?? null, order: next?.desc ? "desc" : "asc" });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        void setQuery({ q: next });
      },
    },
    (state) => ({
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      pagination: state.pagination,
    }),
  );
}

export type GridTable = ReturnType<typeof useGridTable>;
