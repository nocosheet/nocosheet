import { useMemo, useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { purgeTrashMutationOptions, trashQueryOptions } from "@/data/workspace/trash";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { TRASH_RETENTION_DAYS, trashExpiry } from "@/lib/records/retention";

import { useRestoreRecord } from "./use-restore-record";

type TrashedRecord = {
  id: number;
  recordId: string;
  title: string | null;
  deletedAt: number;
  deletedBy: { id: string; label: string | null } | null;
};

const labelOf = (row: TrashedRecord) => row.title ?? `Record #${row.recordId}`;

function Actions({
  workspace,
  tableId,
  row,
}: {
  workspace: string;
  tableId: number;
  row: TrashedRecord;
}) {
  const queryClient = useQueryClient();
  const restore = useRestoreRecord(workspace, tableId);
  const [restoring, setRestoring] = useState(false);

  const purge = useMutation({
    ...purgeTrashMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.trash(tableId) });
      toastManager.add({ type: "success", title: "Deleted forever" });
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
          await restore([row.id]);
          setRestoring(false);
        }}
      >
        <Undo2Icon />
        Restore
      </Button>
      <PurgeDialog
        label={labelOf(row)}
        description={`"${labelOf(row)}" will be removed for good and can't be restored.`}
        pending={purge.isPending}
        error={purge.error}
        onReset={() => purge.reset()}
        onConfirm={(done) =>
          purge.mutate({ workspace, tableId, entryId: row.id }, { onSuccess: done })
        }
      />
    </div>
  );
}

const columns = (
  workspace: string,
  table: string,
): ColumnDef<typeof dataTableFeatures, TrashedRecord>[] => [
  {
    id: "name",
    meta: { label: "Record" },
    enableHiding: false,
    accessorFn: (row) => row.title,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Record" />,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <Link
          to="/workspaces/$workspace/tables/$table/trash/$entry"
          params={{ workspace, table, entry: String(row.original.id) }}
          search={(previous) => previous}
          className="truncate font-medium hover:underline"
        >
          {labelOf(row.original)}
        </Link>
        <span className="truncate font-mono text-muted-foreground text-xs">
          #{row.original.recordId}
        </span>
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
    cell: ({ row }) => <Actions workspace={workspace} tableId={Number(table)} row={row.original} />,
  },
];

export function TrashList({
  workspace,
  tableId,
  table,
}: {
  workspace: string;
  tableId: number;
  table: string;
}) {
  const [query, onQueryChange] = useTrashQuery();
  const { data, isFetching, error } = useQuery({
    ...trashQueryOptions(workspace, tableId, query),
    placeholderData: keepPreviousData,
  });
  const tableColumns = useMemo(() => columns(workspace, table), [workspace, table]);

  return (
    <TrashTable
      columns={tableColumns}
      rows={data?.rows ?? []}
      total={data?.total ?? 0}
      query={query}
      onQueryChange={onQueryChange}
      pending={isFetching}
      searchLabel="Search deleted records"
      empty={error ? error.message : "No deleted records match your search."}
      placeholder={
        <TrashEmpty
          description={`Deleted records stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
        />
      }
    />
  );
}
