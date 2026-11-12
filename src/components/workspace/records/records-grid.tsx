import { useMemo } from "react";

import type { ReactTable } from "@tanstack/react-table";

import { ArrowDownIcon, ArrowUpIcon, Maximize2Icon } from "lucide-react";
import {
  DataGrid,
  type Column,
  type RenderEditCellContentProps,
  type SortColumn,
} from "react-data-grid";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { groupKeyOf } from "@/lib/records/grouping";

import "react-data-grid/lib/styles.css";

import "./records-grid.css";
import { CellEditor, CellValue, cellMode } from "./cells";
import type { ViewerColumn } from "./columns";
import { GroupHeader, type GroupRow } from "./group-header";

export type ViewerRow = Record<string, unknown> & { id: string | number };

type GridRow = ViewerRow | GroupRow;

const isGroupRow = (row: GridRow): row is GroupRow => "__group" in row;

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
  groupBy,
  groups,
  collapsed,
  onToggleGroup,
  onOpenRecord,
  onCellChange,
  selectable = true,
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
  groupBy: ViewerColumn | null;
  groups: Record<string, number> | undefined;
  collapsed: ReadonlySet<string>;
  onToggleGroup: (key: string) => void;
  onOpenRecord?: (id: string | number) => void;
  onCellChange: (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => void;
  selectable?: boolean;
}) {
  const byKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const visible = table.getVisibleLeafColumns();
  const visibleKey = visible.map((column) => column.id).join("|");
  const selection = table.state.rowSelection;

  const dataIndex = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows]);
  const displayRows = useMemo<GridRow[]>(() => {
    if (!groupBy || !groups) return rows;
    const result: GridRow[] = [];
    let current: string | null = null;
    for (const row of rows) {
      const key = groupKeyOf(groupBy.format, row[groupBy.key]);
      if (key !== current) {
        current = key;
        result.push({
          __group: true,
          id: `group:${key}`,
          key,
          value: row[groupBy.key],
          count: groups?.[key] ?? 0,
          collapsed: collapsed.has(key),
        });
      }
      if (!collapsed.has(key)) result.push(row);
    }
    return result;
  }, [rows, groupBy, groups, collapsed]);

  const gridColumns = useMemo<Column<GridRow>[]>(
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
        colSpan: (args) =>
          args.type === "ROW" && isGroupRow(args.row) ? 1 + visible.length : undefined,
        renderCell: ({ row }) =>
          isGroupRow(row) ? (
            groupBy && <GroupHeader column={groupBy} row={row} onToggle={onToggleGroup} />
          ) : (
            <>
              <span className="records-row-index">
                {(page - 1) * pageSize + (dataIndex.get(row.id) ?? 0) + 1}
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
      ...visible.flatMap((column): Column<GridRow>[] => {
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
            editable: inline ? (row) => !isGroupRow(row) && canEditRow(row) : false,
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
              isGroupRow(row) ? null : mode === "toggle" ? (
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
      page,
      pageSize,
      selection,
      canEdit,
      canEditRow,
      workspace,
      onCellChange,
      groupBy,
      onToggleGroup,
      dataIndex,
      selectable,
    ],
  );

  const sortColumns: SortColumn[] = sort
    ? [{ columnKey: sort, direction: order === "desc" ? "DESC" : "ASC" }]
    : [];

  return (
    <DataGrid
      className="records-grid"
      aria-label="Records"
      columns={gridColumns}
      rows={displayRows}
      getRowKey={(row) => row.id}
      rowClass={(row) =>
        isGroupRow(row)
          ? "records-group-row"
          : selection[String(row.id)]
            ? "records-row-selected"
            : undefined
      }
      onRowsChange={(next, { indexes, column }) => {
        const meta = byKey.get(String(column.key));
        const index = indexes[0];
        if (!meta || index === undefined) return;
        const original = displayRows[index];
        const draft = next[index];
        if (isGroupRow(original) || isGroupRow(draft)) return;
        onCellChange(original, draft, meta);
      }}
      onCellDoubleClick={({ row, column }) => {
        if (isGroupRow(row)) return;
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
