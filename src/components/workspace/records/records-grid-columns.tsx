import { useMemo } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { ArrowDownIcon, ArrowUpIcon, Maximize2Icon } from "lucide-react";
import type { Column, RenderEditCellContentProps } from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NamedIcon } from "@/components/workspace/tables/named-icon";

import { CellEditor, CellValue, cellMode } from "./cells";
import type { ViewerColumn } from "./columns";

export type ViewerRow = Record<string, unknown> & { id: string | number };

export function useRecordsGridColumns<TSelected extends { rowSelection: Record<string, boolean> }>({
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
}: {
  table: ReactTable<typeof dataTableFeatures, ViewerRow, TSelected>;
  byKey: ReadonlyMap<string, ViewerColumn>;
  dataIndex: ReadonlyMap<string | number, number>;
  rowOffset: number;
  workspace: string;
  canEdit: boolean;
  canEditRow: (row: ViewerRow) => boolean;
  onOpenRecord?: (id: string | number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
  selectable: boolean;
}) {
  const visible = table.getVisibleLeafColumns();
  const visibleKey = visible.map((column) => column.id).join("|");
  const selection = table.state.rowSelection;

  return useMemo<Column<ViewerRow>[]>(
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
          if (!selectable) return null;
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
        renderCell: ({ row }) => (
          <>
            <span className="records-row-index">
              {rowOffset + (dataIndex.get(row.id) ?? 0) + 1}
            </span>
            {selectable && (
              <Checkbox
                aria-label="Select row"
                className="records-row-check"
                checked={!!selection[String(row.id)]}
                onCheckedChange={(value) => table.getRow(String(row.id)).toggleSelected(!!value)}
              />
            )}
            {onOpenRecord && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Open record"
                className="records-row-open"
                onClick={() => onOpenRecord(row.id)}
              >
                <Maximize2Icon />
              </Button>
            )}
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
            editable: inline ? (row) => canEditRow(row) : false,
            editorOptions: { commitOnOutsideClick: mode === "input" },
            renderEditCell: inline
              ? (props) => (
                  <CellEditor
                    {...(props as unknown as RenderEditCellContentProps<ViewerRow>)}
                    column={meta}
                    workspace={workspace}
                  />
                )
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
    [
      visibleKey,
      byKey,
      rowOffset,
      selection,
      canEdit,
      canEditRow,
      workspace,
      onCellChange,
      onOpenRecord,
      dataIndex,
      selectable,
    ],
  );
}
