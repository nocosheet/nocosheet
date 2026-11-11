import { useMemo } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Undo2Icon } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashEmpty } from "@/components/workspace/trash/trash-empty";
import { TrashTable, useTrashQuery } from "@/components/workspace/trash/trash-table";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedTablesQueryOptions,
  purgeTableMutationOptions,
  restoreTableMutationOptions,
} from "@/data/workspace/tables";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { TRASH_RETENTION_DAYS, trashExpiry } from "@/lib/records/retention";

import { NamedIcon } from "./named-icon";

type DeletedTable = {
  id: number;
  name: string;
  tableName: string;
  icon: string | null;
  deletedAt: number;
  deletedBy: { id: string; label: string | null } | null;
};

function Actions({ workspace, row }: { workspace: string; row: DeletedTable }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });

  const restore = useMutation({
    ...restoreTableMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: `${row.name} restored` });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't restore the table",
        description: error.message,
      }),
  });

  const purge = useMutation({
    ...purgeTableMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: `${row.name} deleted forever` });
    },
  });

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="outline"
        size="sm"
        loading={restore.isPending}
        onClick={() => restore.mutate({ workspace, id: row.id })}
      >
        <Undo2Icon />
        Restore
      </Button>
      <PurgeDialog
        label={row.name}
        description={`"${row.name}" will be deleted with its columns, views, widgets and every record. This can't be undone.`}
        pending={purge.isPending}
        error={purge.error}
        onReset={() => purge.reset()}
        onConfirm={(done) => purge.mutate({ workspace, id: row.id }, { onSuccess: done })}
      />
    </div>
  );
}

const columns = (workspace: string): ColumnDef<typeof dataTableFeatures, DeletedTable>[] => [
  {
    id: "name",
    meta: { label: "Name" },
    enableHiding: false,
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <NamedIcon name={row.original.icon} className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    id: "deletedAt",
    meta: { label: "Deleted" },
    accessorKey: "deletedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Deleted" />,
    cell: ({ row }) => (
      <span
        className="text-muted-foreground"
        title={new Date(row.original.deletedAt).toLocaleString()}
      >
        {formatRelativeTime(row.original.deletedAt)}
      </span>
    ),
  },
  {
    id: "expires",
    meta: { label: "Deleted forever" },
    enableSorting: false,
    header: "Deleted forever",
    cell: ({ row }) => (
      <span
        className="text-muted-foreground"
        title={new Date(trashExpiry(row.original.deletedAt)).toLocaleString()}
      >
        {formatRelativeTime(trashExpiry(row.original.deletedAt))}
      </span>
    ),
  },
  {
    id: "deletedBy",
    meta: { label: "Deleted by" },
    enableSorting: false,
    header: "Deleted by",
    cell: ({ row }) =>
      row.original.deletedBy?.label ?? <span className="text-muted-foreground">—</span>,
  },
  {
    id: "actions",
    meta: { label: "Actions" },
    enableSorting: false,
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <Actions workspace={workspace} row={row.original} />,
  },
];

export function TablesTrash({ workspace }: { workspace: string }) {
  const [query, onQueryChange] = useTrashQuery();
  const tableColumns = useMemo(() => columns(workspace), [workspace]);
  const { data, isFetching, error } = useQuery({
    ...deletedTablesQueryOptions(workspace, query),
    placeholderData: keepPreviousData,
  });

  return (
    <TrashTable
      columns={tableColumns}
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      query={query}
      onQueryChange={onQueryChange}
      pending={isFetching}
      searchLabel="Search deleted tables"
      empty={error ? error.message : "No deleted tables match your search."}
      placeholder={
        <TrashEmpty
          description={`Deleted tables stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
        />
      }
    />
  );
}
