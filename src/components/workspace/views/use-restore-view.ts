import { useCallback } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { restoreViewMutationOptions } from "@/data/workspace/views";

export function useRestoreView(workspace: string, tableId: number) {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation(restoreViewMutationOptions);

  return useCallback(
    async (viewId: number, name: string) => {
      try {
        await mutateAsync({ workspace, tableId, viewId });
        await queryClient.invalidateQueries({ queryKey: workspaceKeys.views(tableId) });
        toastManager.add({ type: "success", title: `${name} restored` });
      } catch (error) {
        toastManager.add({
          type: "error",
          title: "Couldn't restore the view",
          description: error instanceof Error ? error.message : undefined,
        });
      }
    },
    [mutateAsync, queryClient, workspace, tableId],
  );
}
