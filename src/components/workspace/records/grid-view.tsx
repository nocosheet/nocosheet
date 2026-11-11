import { useEffect, useMemo, useState } from "react";

import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { type ColumnDef, functionalUpdate, useTable } from "@tanstack/react-table";

import { SearchIcon, XIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { dataTableFeatures } from "@/components/shared/data-table/features";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordsQueryOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { recordsSearchParams, resolveRecordsQuery } from "@/lib/records/query";
import { cn } from "@/lib/utils";

import { buildViewerColumns } from "./columns";
import { DeleteRecordsDialog } from "./delete-records-dialog";
import { RecordExport } from "./record-export";
import { RecordFilters } from "./record-filters";
import { RecordsGrid, type ViewerRow } from "./records-grid";
import { useUpdateCell } from "./use-update-cell";

export function GridView({
  workspace,
  tableId,
  onOpenRecord,
}: {
  workspace: string;
  tableId: number;
  onOpenRecord: (id: string | number) => void;
}) {
  const { isAdmin } = useWorkspace();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const [urlQuery, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });
  const viewerColumns = useMemo(() => buildViewerColumns(table), [table]);
  const resolved = resolveRecordsQuery(urlQuery);
  const sortable = new Set(viewerColumns.filter((column) => column.sortable).map((c) => c.key));
  const filterable = new Set(viewerColumns.filter((column) => column.filterable).map((c) => c.key));
  const query = {
    ...resolved,
    sort: resolved.sort && sortable.has(resolved.sort) ? resolved.sort : null,
    filters: resolved.filters.filter((filter) => filterable.has(filter.column)),
  };

  const recordsOptions = recordsQueryOptions(workspace, tableId, query);
  const updateCell = useUpdateCell({ workspace, tableId, queryKey: recordsOptions.queryKey });

  const { data, isFetching, error } = useQuery({
    ...recordsOptions,
    placeholderData: keepPreviousData,
  });
  const rows = (data?.rows ?? []) as ViewerRow[];
  const total = data?.total ?? 0;

  const columnDefs = useMemo<ColumnDef<typeof dataTableFeatures, ViewerRow>[]>(
    () =>
      viewerColumns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: column.name,
        meta: { label: column.name },
        enableSorting: column.sortable,
        enableHiding: !column.title,
      })),
    [viewerColumns],
  );
  const initialVisibility = useMemo(
    () => Object.fromEntries(viewerColumns.map((column) => [column.key, !column.hiddenByDefault])),
    [viewerColumns],
  );

  const grid = useTable(
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
        sorting: query.sort ? [{ id: query.sort, desc: query.order === "desc" }] : [],
        globalFilter: query.q,
      },
      onPaginationChange: (updater) => {
        const next = functionalUpdate(updater, {
          pageIndex: query.page - 1,
          pageSize: query.pageSize,
        });
        void setUrlQuery({ page: next.pageIndex + 1 });
      },
      onSortingChange: (updater) => {
        const [next] = functionalUpdate(
          updater,
          query.sort ? [{ id: query.sort, desc: query.order === "desc" }] : [],
        );
        void setUrlQuery({ sort: next?.id ?? null, order: next?.desc ? "desc" : "asc", page: 1 });
      },
      onGlobalFilterChange: (updater) => {
        const next = functionalUpdate(updater, query.q) as string;
        void setUrlQuery({ q: next, page: 1 });
      },
    },
    (state) => ({ columnVisibility: state.columnVisibility, rowSelection: state.rowSelection }),
  );

  const searchable = viewerColumns.some((column) => column.searchable);
  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);
  useEffect(() => {
    if (search === query.q) return;
    const timeout = setTimeout(() => grid.setGlobalFilter(search), 300);
    return () => clearTimeout(timeout);
  }, [search, query.q, grid]);

  const queryKey = JSON.stringify(query);
  const selectedRows = rows.filter((row) => grid.state.rowSelection[String(row.id)]);
  useEffect(() => {
    if (selectedRows.length > 0) grid.resetRowSelection();
  }, [queryKey]);

  const filtered = query.q !== "" || query.filters.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {selectedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
          <Button variant="outline" onClick={() => grid.resetRowSelection()}>
            <XIcon />
            {selectedRows.length} selected
          </Button>
          <div className="ms-auto flex items-center gap-2">
            <RecordExport workspace={workspace} tableId={tableId} selected={selectedRows} />
            {isAdmin && (
              <DeleteRecordsDialog
                workspace={workspace}
                tableId={tableId}
                ids={selectedRows.map((row) => row.id)}
                onDeleted={(deleted) => {
                  grid.resetRowSelection();
                  const lastPage = Math.max(1, Math.ceil((total - deleted) / query.pageSize));
                  if (query.page > lastPage) void setUrlQuery({ page: lastPage });
                }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
          {searchable && (
            <div className="relative w-full sm:w-72">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search records"
                placeholder="Search records"
                className="ps-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          )}
          <RecordFilters
            columns={viewerColumns}
            value={query.filters}
            join={query.join}
            onApply={(filters, join) =>
              void setUrlQuery({ filters: filters.length ? filters : null, join, page: 1 })
            }
          />
          <div className="ms-auto flex items-center gap-2">
            <DataTableViewOptions table={grid} />
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error" className="mx-4 mb-2 w-auto">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <div
        className={cn(
          "relative min-h-60 flex-1 bg-background transition-opacity",
          isFetching && "opacity-70",
        )}
      >
        <RecordsGrid
          table={grid}
          columns={viewerColumns}
          rows={rows}
          page={query.page}
          pageSize={query.pageSize}
          workspace={workspace}
          canEdit={isAdmin}
          onOpenRecord={onOpenRecord}
          onCellChange={(original, draft, column) => void updateCell(original, draft, column)}
          sort={query.sort}
          order={query.order}
          empty={
            error
              ? "The records could not be loaded."
              : filtered
                ? "No records match your filters."
                : "This table has no records yet."
          }
        />
      </div>
      <div className="border-t px-4 py-2">
        <DataTablePagination
          page={query.page}
          pageSize={query.pageSize}
          total={total}
          onPageChange={(page) => grid.setPageIndex(page - 1)}
        />
      </div>
    </div>
  );
}
