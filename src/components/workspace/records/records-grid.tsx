import { useMemo } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { ArrowDownIcon, ArrowUpIcon, Maximize2Icon } from "lucide-react";
import { DataGrid, type Column, type SortColumn } from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NamedIcon } from "@/components/workspace/tables/named-icon";

import "react-data-grid/lib/styles.css";

import "./records-grid.css";
import { CellEditor, CellValue, cellMode } from "./cells";
import type { ViewerColumn } from "./columns";

export type ViewerRow = Record<string, unknown> & { id: string | number };

const ROW_HEIGHT = 36;

export function RecordsGrid<TSelected extends { rowSelection: Record<string, boolean> }>({
  table,
  columns,
  rows,
  page,
  pageSize,
  sort,
  order,
  empty,
  workspace,
  canEdit,
  canEditRow,
  onOpenRecord,
  onCellChange,
}: {
  table: ReactTable<typeof dataTableFeatures, ViewerRow, TSelected>;
  columns: ViewerColumn[];
  rows: ViewerRow[];
  page: number;
  pageSize: number;
  sort: string | null;
  order: "asc" | "desc";
  empty: string;
  workspace: string;
  canEdit: boolean;
  canEditRow: (row: ViewerRow) => boolean;
  onOpenRecord: (id: string | number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
}) {
  const byKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const visible = table.getVisibleLeafColumns();
  const visibleKey = visible.map((column) => column.id).join("|");
  const selection = table.state.rowSelection;

  const gridColumns = useMemo<Column<ViewerRow>[]>(
    () => [
      {
        key: "__row",
        name: "",
        width: 76,
        minWidth: 76,
        resizable: false,
        sortable: false,
        cellClass: "records-row-number",
        headerCellClass: "records-row-number",
        renderHeaderCell: () => {
          const all = table.getIsAllPageRowsSelected();
          return (
            <Checkbox
              aria-label="Select all"
              checked={all}
              indeterminate={table.getIsSomePageRowsSelected() && !all}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            />
          );
        },
        renderCell: ({ row, rowIdx }) => (
          <>
            <span className="records-row-index">{(page - 1) * pageSize + rowIdx + 1}</span>
            <Checkbox
              aria-label="Select row"
              className="records-row-check"
              checked={!!selection[String(row.id)]}
              onCheckedChange={(value) => table.getRow(String(row.id)).toggleSelected(!!value)}
            />
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Open record"
              className="records-row-open"
              onClick={() => onOpenRecord(row.id)}
            >
              <Maximize2Icon />
            </Button>
          </>
        ),
      },
      ...visible.flatMap((column): Column<ViewerRow>[] => {
        const meta = byKey.get(column.id);
        if (!meta) return [];
        const mode = canEdit ? cellMode(meta) : "readonly";
        const inline = mode === "input" || mode === "popup";
        return [
          {
            key: meta.key,
            name: meta.name,
            width: meta.width,
            minWidth: 96,
            resizable: true,
            sortable: column.getCanSort(),
            renderHeaderCell: ({ sortDirection }) => (
              <span className="flex h-full min-w-0 items-center gap-1.5">
                <NamedIcon
                  name={meta.icon}
                  fallback={meta.formatIcon}
                  className="size-3.5 shrink-0"
                />
                <span className="truncate">{meta.name}</span>
                {sortDirection === "ASC" && <ArrowUpIcon className="ms-auto size-3.5 shrink-0" />}
                {sortDirection === "DESC" && (
                  <ArrowDownIcon className="ms-auto size-3.5 shrink-0" />
                )}
              </span>
            ),
            editable: inline ? canEditRow : false,
            editorOptions: { commitOnOutsideClick: mode === "input" },
            renderEditCell: inline
              ? (props) => <CellEditor {...props} column={meta} workspace={workspace} />
              : undefined,
            renderCell: ({ row }) =>
              mode === "toggle" ? (
                <Checkbox
                  aria-label={meta.name}
                  checked={row[meta.key] === true}
                  disabled={!canEditRow(row)}
                  onCheckedChange={(value) =>
                    onCellChange(row, { ...row, [meta.key]: !!value }, meta)
                  }
                />
              ) : (
                <CellValue column={meta} value={row[meta.key]} />
              ),
          },
        ];
      }),
    ],
    [visibleKey, byKey, page, pageSize, selection, canEdit, canEditRow, workspace, onCellChange],
  );

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
        if (meta && index !== undefined) onCellChange(rows[index], next[index], meta);
      }}
      onCellDoubleClick={({ row, column }) => {
        const meta = byKey.get(String(column.key));
        if (!meta) return;
        const mode = canEdit ? cellMode(meta) : "readonly";
        if (mode === "readonly" || mode === "sheet") onOpenRecord(row.id);
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
