import { useMemo } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { DataGrid, type SortColumn } from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";

import "react-data-grid/lib/styles.css";

import "./records-grid.css";
import { cellMode } from "./cells";
import type { ViewerColumn } from "./columns";
import { type ViewerRow, useRecordsGridColumns } from "./records-grid-columns";

export type { ViewerRow };

const ROW_HEIGHT = 36;

export function RecordsGrid<TSelected extends { rowSelection: Record<string, boolean> }>({
  table,
  columns,
  rows,
  rowOffset,
  sort,
  order,
  empty,
  workspace,
  canEdit,
  canEditRow,
  onOpenRecord,
  onCellChange,
  selectable = true,
}: {
  table: ReactTable<typeof dataTableFeatures, ViewerRow, TSelected>;
  columns: ViewerColumn[];
  rows: ViewerRow[];
  rowOffset: number;
  sort: string | null;
  order: "asc" | "desc";
  empty: string;
  workspace: string;
  canEdit: boolean;
  canEditRow: (row: ViewerRow) => boolean;
  onOpenRecord?: (id: string | number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
  selectable?: boolean;
}) {
  const byKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const selection = table.state.rowSelection;

  const dataIndex = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows]);
  const gridColumns = useRecordsGridColumns({
    table,
    byKey,
    dataIndex,
    rowOffset,
    workspace,
    canEdit,
    canEditRow,
    onOpenRecord,
    onCellChange,
    selectable,
  });

  const sortColumns: SortColumn[] = sort
    ? [{ columnKey: sort, direction: order === "desc" ? "DESC" : "ASC" }]
    : [];

  return (
    <DataGrid
      className="records-grid"
      aria-label="Records"
      columns={gridColumns}
      rows={rows}
      getRowKey={(row) => row.id}
      rowClass={(row) => (selection[String(row.id)] ? "records-row-selected" : undefined)}
      onRowsChange={(next, { indexes, column }) => {
        const meta = byKey.get(String(column.key));
        const index = indexes[0];
        if (!meta || index === undefined) return;
        const original = rows[index];
        const draft = next[index];
        onCellChange(original, draft, meta);
      }}
      onCellDoubleClick={({ row, column }) => {
        const meta = byKey.get(String(column.key));
        if (!meta) return;
        const mode = canEdit ? cellMode(meta) : "readonly";
        if (mode === "readonly" || mode === "sheet") onOpenRecord?.(row.id);
      }}
      rowHeight={ROW_HEIGHT}
      headerRowHeight={ROW_HEIGHT}
      sortColumns={sortColumns}
      onSortColumnsChange={(next) => {
        const last = next.at(-1);
        table.setSorting(last ? [{ id: last.columnKey, desc: last.direction === "DESC" }] : []);
      }}
      renderers={{
        noRowsFallback: (
          <div className="col-span-full flex items-center justify-center p-10 text-muted-foreground text-sm">
            {empty}
          </div>
        ),
      }}
    />
  );
}
