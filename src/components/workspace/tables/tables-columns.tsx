import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { NamedIcon } from "./named-icon";

function TableName({ id, name }: { id: number; name: string }) {
  const { id: workspace, isAdmin } = useWorkspace();
  if (!isAdmin) return <span className="truncate font-medium">{name}</span>;
  return (
    <Link
      to="/w/$workspace/tables/$table/definition"
      params={{ workspace, table: String(id) }}
      className="truncate font-medium hover:underline"
    >
      {name}
    </Link>
  );
}
import type { TablesRow } from "./tables-table";

const ID_TYPE_LABELS = { increment: "Auto-increment", uuid: "UUID" } as const;

export const tablesColumns: ColumnDef<typeof dataTableFeatures, TablesRow>[] = [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => {
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
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    id: "name",
    meta: { label: "Name" },
    enableHiding: false,
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <NamedIcon name={row.original.icon} className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <TableName id={row.original.id} name={row.original.name} />
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
    id: "groupName",
    meta: { label: "Group" },
    accessorKey: "groupName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
    cell: ({ row }) =>
      row.original.groupName ? (
        <Badge variant="outline">{row.original.groupName}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
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
    id: "idType",
    meta: { label: "Record id" },
    accessorKey: "idType",
    header: "Record id",
    enableSorting: false,
    cell: ({ row }) => ID_TYPE_LABELS[row.original.idType],
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
