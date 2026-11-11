import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { toastManager } from "@/components/ui/toast";
import { ApiError } from "@/data/workspace/api-error";
import { workspaceKeys } from "@/data/workspace/keys";
import { restoreRecord, type RestoreFailure } from "@/data/workspace/trash";

export function useRestoreRecord(workspace: string, tableId: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async (entryIds: number[]) => {
    let restored = 0;
    let failed: { entryId: number; error: Error } | null = null;

    for (const entryId of entryIds) {
      try {
        await restoreRecord({ workspace, tableId, entryId });
        restored++;
      } catch (error) {
        failed = { entryId, error: error instanceof Error ? error : new Error("Restore failed") };
        break;
      }
    }

    if (restored > 0) {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({
        type: "success",
        title: `Restored ${restored} ${restored === 1 ? "record" : "records"}`,
      });
    }

    if (failed) {
      toastManager.add({
        type: "error",
        title: "Couldn't restore the record",
        description: failed.error.message,
      });
      queryClient.setQueryData<RestoreFailure>(
        workspaceKeys.restoreError(tableId, failed.entryId),
        {
          message: failed.error.message,
          field: failed.error instanceof ApiError ? failed.error.field : undefined,
        },
      );
      void navigate({
        to: "/w/$workspace/tables/$table/trash/$entry",
        params: { workspace, table: String(tableId), entry: String(failed.entryId) },
      });
    }

    return !failed;
  };
}
