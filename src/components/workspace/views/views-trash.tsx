import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashRows, type TrashRow } from "@/components/workspace/trash/trash-rows";
import { workspaceKeys } from "@/data/workspace/keys";
import { deletedViewsQueryOptions, purgeViewMutationOptions } from "@/data/workspace/views";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

import { useRestoreView } from "./use-restore-view";

function Actions({
  workspace,
  tableId,
  row,
}: {
  workspace: string;
  tableId: number;
  row: TrashRow;
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
    <>
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
    </>
  );
}

export function ViewsTrash({ workspace, tableId }: { workspace: string; tableId: number }) {
  const { data, isPending, error } = useQuery(deletedViewsQueryOptions(workspace, tableId));

  return (
    <TrashRows
      rows={data?.rows}
      nameLabel="View"
      loading={isPending}
      error={error}
      emptyDescription={`Deleted views stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
      actions={(row) => <Actions workspace={workspace} tableId={tableId} row={row} />}
    />
  );
}
