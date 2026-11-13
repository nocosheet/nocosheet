import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashRows, type TrashRow } from "@/components/workspace/trash/trash-rows";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedTablesQueryOptions,
  purgeTableMutationOptions,
  restoreTableMutationOptions,
} from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

function Actions({ workspace, row }: { workspace: string; row: TrashRow }) {
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
    <>
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
    </>
  );
}

export function TablesTrash({ workspace }: { workspace: string }) {
  const { data, isPending, error } = useQuery(deletedTablesQueryOptions(workspace));

  return (
    <TrashRows
      rows={data?.rows}
      nameLabel="Table"
      loading={isPending}
      error={error}
      emptyDescription={`Deleted tables stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
      actions={(row) => <Actions workspace={workspace} row={row} />}
    />
  );
}
