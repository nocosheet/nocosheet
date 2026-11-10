import { useEffect, useState } from "react";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Frame, FrameFooter } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { tablesQueryOptions } from "@/data/workspace/tables";
import { tablesSearchParams, type TablesQuery } from "@/lib/tables/query";

import { DeleteTablesDialog } from "./delete-tables-dialog";
import { tablesColumns } from "./tables-columns";

export type TablesRow = NonNullable<ReturnType<typeof useTablesRows>["data"]>["rows"][number];

function useTablesRows(workspace: string, query: TablesQuery) {
  return useQuery({
    ...tablesQueryOptions(workspace, query),
    placeholderData: keepPreviousData,
  });
}

export function TablesTable({
  workspace,
  empty,
  placeholder,
}: {
  workspace: string;
  empty: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const [query, setQuery] = useQueryStates(tablesSearchParams, { history: "replace" });
  const onQueryChange = (patch: Partial<TablesQuery>) => void setQuery(patch);
  const { data, isFetching } = useTablesRows(workspace, query);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const table = useTable(
    {
      features: dataTableFeatures,
      columns: tablesColumns,
      data: rows,
      getRowId: (row) => String(row.id),
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
      enableRowSelection: true,
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
          pageSize: next.pageSize as TablesQuery["pageSize"],
        });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(updater, [
          { id: query.sort, desc: query.order === "desc" },
        ]);
        if (!next) return;
        onQueryChange({
          sort: next.id as TablesQuery["sort"],
          order: next.desc ? "desc" : "asc",
          page: 1,
        });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        onQueryChange({ q: next, page: 1 });
      },
    },
    (state) => ({
      rowSelection: state.rowSelection,
      columnVisibility: state.columnVisibility,
    }),
  );

  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search === query.q) return;
    const timeout = setTimeout(() => table.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, table]);

  const selectedIds = Object.entries(table.state.rowSelection)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id));

  if (data && total === 0 && !query.q) return placeholder;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search tables"
            placeholder="Search tables"
            className="ps-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <DeleteTablesDialog
              workspace={workspace}
              ids={selectedIds}
              onDeleted={(deleted) => {
                table.resetRowSelection();
                const lastPage = Math.max(1, Math.ceil((total - deleted) / query.pageSize));
                if (query.page > lastPage) onQueryChange({ page: lastPage });
              }}
            />
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <Frame>
        <DataTable table={table} empty={empty} pending={isFetching} />
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
