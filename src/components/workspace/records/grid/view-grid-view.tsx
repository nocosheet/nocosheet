import { useMemo } from "react";

import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { DataTablePagination } from "@/components/shared/data-table/data-table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tableQueryOptions } from "@/data/workspace/tables";
import { viewRecordsQueryOptions } from "@/data/workspace/views";
import { cn } from "@/lib/utils";

import { buildViewerColumns } from "../columns";
import { RecordsGrid, type ViewerRow } from "../records-grid";
import { GridToolbar } from "./grid-toolbar";
import { useGridTable } from "./use-grid-table";
import { useGroupCollapse } from "./use-group-collapse";
import { useRecordsQuery } from "./use-records-query";

export function ViewGridView({
  workspace,
  tableId,
  view,
}: {
  workspace: string;
  tableId: number;
  view: { id: number; selectColumns: string[] };
}) {
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const columns = useMemo(
    () =>
      buildViewerColumns({
        ...table,
        columns: table.columns.filter((column) => view.selectColumns.includes(column.columnName)),
      }),
    [table, view.selectColumns],
  );
  const { query, setUrlQuery } = useRecordsQuery(columns);

  const { data, isFetching, error } = useQuery({
    ...viewRecordsQueryOptions(workspace, tableId, view.id, query),
    placeholderData: keepPreviousData,
  });
  const rows = (data?.rows ?? []) as ViewerRow[];
  const total = data?.total ?? 0;

  const grid = useGridTable({ columns, rows, total, query, setQuery: setUrlQuery });
  const { collapsed, toggle, reset } = useGroupCollapse();

  const groupColumn = columns.find((column) => column.key === query.group) ?? null;
  const groups = data && "groups" in data && data.group === query.group ? data.groups : undefined;

  const filtered = query.q !== "" || query.filters.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GridToolbar
        grid={grid}
        columns={columns}
        query={query}
        setQuery={setUrlQuery}
        onGroupChange={reset}
      />

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
          columns={columns}
          rows={rows}
          page={query.page}
          pageSize={query.pageSize}
          workspace={workspace}
          canEdit={false}
          selectable={false}
          canEditRow={() => false}
          groupBy={groupColumn}
          groups={groups}
          collapsed={collapsed}
          onToggleGroup={toggle}
          onCellChange={() => undefined}
          sort={query.sort}
          order={query.order}
          empty={
            error
              ? "The records could not be loaded."
              : filtered
                ? "No records match your filters."
                : "No records match this view."
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
