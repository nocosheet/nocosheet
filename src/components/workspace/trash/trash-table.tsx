import { useEffect, useState } from "react";

import { type ColumnDef, functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon } from "lucide-react";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Frame, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { resolveTrashQuery, type TrashQuery } from "@/lib/trash/query";

export function useTrashQuery() {
  const [query, setQuery] = useState<TrashQuery>(() => resolveTrashQuery({}));
  return [query, (patch: Partial<TrashQuery>) => setQuery((previous) => ({ ...previous, ...patch }))] as const;
}

export function TrashTable<TRow extends { id: number }>({
  columns,
  rows,
  total,
  query,
  onQueryChange,
  pending,
  searchLabel,
  empty,
  placeholder,
}: {
  columns: ColumnDef<typeof dataTableFeatures, TRow>[];
  rows: TRow[];
  total: number;
  query: TrashQuery;
  onQueryChange: (patch: Partial<TrashQuery>) => void;
  pending: boolean;
  searchLabel: string;
  empty: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const table = useTable(
    {
      features: dataTableFeatures,
      columns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      enableMultiSort: false,
      enableSortingRemoval: false,
      rowCount: total,
      state: {
        pagination: { pageIndex: query.page - 1, pageSize: query.pageSize },
        sorting: [{ id: query.sort, desc: query.order === "desc" }],
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, {
          pageIndex: query.page - 1,
          pageSize: query.pageSize,
        });
        onQueryChange({
          page: next.pageSize === query.pageSize ? next.pageIndex + 1 : 1,
          pageSize: next.pageSize as TrashQuery["pageSize"],
        });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, [
          { id: query.sort, desc: query.order === "desc" },
        ]);
        if (!next) return;
        onQueryChange({
          sort: next.id as TrashQuery["sort"],
          order: next.desc ? "desc" : "asc",
          page: 1,
        });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        onQueryChange({ q: next, page: 1 });
      },
    },
    (state) => ({ columnVisibility: state.columnVisibility }),
  );

  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search === query.q) return;
    const timeout = setTimeout(() => table.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, table]);

  if (total === 0 && !query.q && !pending) return placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={searchLabel}
            placeholder={searchLabel}
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <Frame>
        <DataTable table={table} empty={empty} pending={pending} />
        <FrameFooter className="p-2">
          <DataTablePagination
            page={query.page}
            pageSize={query.pageSize}
            total={total}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </FrameFooter>
      </Frame>
    </div>
  );
}
