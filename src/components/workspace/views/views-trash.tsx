import { useMemo, useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { LayoutGridIcon, Undo2Icon } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashEmpty } from "@/components/workspace/trash/trash-empty";
import { TrashTable, useTrashQuery } from "@/components/workspace/trash/trash-table";
import { workspaceKeys } from "@/data/workspace/keys";
import { deletedViewsQueryOptions, purgeViewMutationOptions } from "@/data/workspace/views";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { TRASH_RETENTION_DAYS, trashExpiry } from "@/lib/records/retention";

import { NamedIcon } from "../tables/named-icon";
import { useRestoreView } from "./use-restore-view";

type DeletedView = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  deletedAt: number;
  deletedBy: { id: string; label: string | null } | null;
};

function Actions({
  workspace,
  tableId,
  row,
}: {
  workspace: string;
  tableId: number;
  row: DeletedView;
}) {
  const queryClient = useQueryClient();
  const restore = useRestoreView(workspace, tableId);
  const [restoring, setRestoring] = useState(false);

  const purge = useMutation({
    ...purgeViewMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.views(tableId) });
      toastManager.add({ type: "success", title: `${row.name} deleted forever` });
    },
  });

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="outline"
        size="sm"
        loading={restoring}
        onClick={async () => {
          setRestoring(true);
          await restore(row.id, row.name);
          setRestoring(false);
        }}
      >
        <Undo2Icon />
        Restore
      </Button>
      <PurgeDialog
        label={row.name}
        description={`"${row.name}" will be removed for good and can't be restored. The records in the table are not affected.`}
        pending={purge.isPending}
        error={purge.error}
        onReset={() => purge.reset()}
        onConfirm={(done) =>
          purge.mutate({ workspace, tableId, viewId: row.id }, { onSuccess: done })
        }
      />
    </div>
  );
}

const columns = (
  workspace: string,
  tableId: number,
): ColumnDef<typeof dataTableFeatures, DeletedView>[] => [
  {
    id: "name",
    meta: { label: "View" },
    enableHiding: false,
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="View" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <NamedIcon
          name={row.original.icon}
          fallback={LayoutGridIcon}
          className="size-4 shrink-0 text-muted-foreground"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
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
    cell: ({ row }) => <Actions workspace={workspace} tableId={tableId} row={row.original} />,
  },
];

export function ViewsTrash({ workspace, tableId }: { workspace: string; tableId: number }) {
  const [query, onQueryChange] = useTrashQuery();
  const tableColumns = useMemo(() => columns(workspace, tableId), [workspace, tableId]);
  const { data, isFetching, error } = useQuery({
    ...deletedViewsQueryOptions(workspace, tableId, query),
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
      searchLabel="Search deleted views"
      empty={error ? error.message : "No deleted views match your search."}
      placeholder={
        <TrashEmpty
          description={`Deleted views stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
        />
      }
    />
  );
}
