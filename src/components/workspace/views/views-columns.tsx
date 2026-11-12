import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { LayoutGridIcon } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Checkbox } from "@/components/ui/checkbox";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { NamedIcon } from "../tables/named-icon";
import type { ViewsRow } from "./views-table";

export function viewsColumns({
  workspace,
  table,
  canManage,
}: {
  workspace: string;
  table: string;
  canManage: boolean;
}): ColumnDef<typeof dataTableFeatures, ViewsRow>[] {
  return [
    ...(canManage
      ? [
          {
            id: "select",
            enableSorting: false,
            enableHiding: false,
            header: ({ table: grid }) => {
              const all = grid.getIsAllPageRowsSelected();
              return (
                <Checkbox
                  aria-label="Select all"
                  checked={all}
                  indeterminate={grid.getIsSomePageRowsSelected() && !all}
                  onCheckedChange={(value) => grid.toggleAllPageRowsSelected(!!value)}
                />
              );
            },
            cell: ({ row }) => (
              <Checkbox
                aria-label={`Select ${row.original.name}`}
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
              />
            ),
          } satisfies ColumnDef<typeof dataTableFeatures, ViewsRow>,
        ]
      : []),
    {
      id: "name",
      meta: { label: "Name" },
      enableHiding: false,
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <NamedIcon
            name={row.original.icon}
            fallback={LayoutGridIcon}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex min-w-0 flex-col">
            <Link
              to="/w/$workspace/tables/$table/view/$view"
              params={{ workspace, table, view: String(row.original.id) }}
              className="truncate font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            {row.original.description && (
              <span className="truncate text-muted-foreground text-xs">
                {row.original.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "columnCount",
      meta: { label: "Columns" },
      accessorKey: "columnCount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Columns" />,
      cell: ({ row }) => <span className="tabular-nums">{row.original.columnCount}</span>,
    },
    {
      id: "updatedAt",
      meta: { label: "Updated" },
      accessorKey: "updatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => (
        <span
          className="text-muted-foreground"
          title={new Date(row.original.updatedAt).toLocaleString()}
        >
          {formatRelativeTime(row.original.updatedAt)}
        </span>
      ),
    },
  ];
}
