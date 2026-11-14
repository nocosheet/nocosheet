import { useEffect, useMemo } from "react";

import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { CursorPagination } from "@/components/shared/data-table/cursor-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tableQueryOptions } from "@/data/workspace/tables";
import { viewRecordsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { RECORD_PAGE_SIZES } from "@/lib/records/query";
import { cn } from "@/lib/utils";

import { buildViewColumns, type ViewScope } from "../columns";
import { RecordsGrid, type ViewerRow } from "../records-grid";
import { useUpdateCell } from "../use-update-cell";
import { GridToolbar } from "./grid-toolbar";
import { SelectionBar } from "./selection-bar";
import { useGridTable } from "./use-grid-table";
import { useRecordsPaging, useRecordsQuery } from "./use-records-query";

const ownerOf = (row: ViewerRow) => (row.created_by as { id?: string } | null | undefined)?.id;

export function ViewGridView({
  workspace,
  tableId,
  view,
  onOpenRecord,
}: {
  workspace: string;
  tableId: number;
  view: ViewScope;
  onOpenRecord?: (id: string | number) => void;
}) {
  const access = useAccess();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const columns = useMemo(
    () => buildViewColumns(table, view.selectColumns),
    [table, view.selectColumns],
  );
  const { query, setUrlQuery, setCursor } = useRecordsQuery(columns);

  const recordsOptions = viewRecordsQueryOptions(workspace, tableId, view.id, query);
  const updateCell = useUpdateCell({ workspace, tableId, queryKey: recordsOptions.queryKey });
  const { data, isFetching, error } = useQuery({
    ...recordsOptions,
    placeholderData: keepPreviousData,
  });
  const rows = (data?.rows ?? []) as ViewerRow[];
  const paging = useRecordsPaging({
    data,
    query,
    setCursor,
    optionsFor: (q) => viewRecordsQueryOptions(workspace, tableId, view.id, q),
  });

  const grid = useGridTable({
    columns,
    rows,
    query,
    setQuery: setUrlQuery,
    paging,
  });
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    grid.resetRowSelection();
  }, [queryKey]);
  const selectedRows = rows.filter((row) => grid.state.rowSelection[String(row.id)]);

  const filtered = query.q !== "" || query.filters.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {selectedRows.length > 0 ? (
        <SelectionBar
          workspace={workspace}
          tableId={tableId}
          select={{
            canExport: false,
            canDelete: (row) => access.canOn("delete", tableId, ownerOf(row)),
          }}
          grid={grid}
          selected={selectedRows}
          pageRows={rows.length}
          paging={paging}
        />
      ) : (
        <GridToolbar grid={grid} columns={columns} query={query} />
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
          columns={columns}
          rows={rows}
          workspace={workspace}
          canEdit={access.can("update", tableId)}
          selectable={access.can("delete", tableId)}
          canEditRow={(row) => access.canOn("update", tableId, ownerOf(row))}
          onOpenRecord={onOpenRecord}
          onCellChange={(original, draft, column) => void updateCell(original, draft, column)}
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
        <CursorPagination table={grid} count={rows.length} pageSizes={RECORD_PAGE_SIZES} />
      </div>
    </div>
  );
}
