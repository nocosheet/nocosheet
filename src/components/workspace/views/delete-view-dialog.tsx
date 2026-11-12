import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { deleteViewMutationOptions } from "@/data/workspace/views";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

import { useRestoreView } from "./use-restore-view";

export function DeleteViewDialog({
  workspace,
  tableId,
  view,
  open,
  onOpenChange,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  view: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const restore = useRestoreView(workspace, tableId);

  const deleteView = useMutation({
    ...deleteViewMutationOptions,
    onSuccess: async () => {
      onOpenChange(false);
      onDeleted();
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.views(tableId) });
      toastManager.add({
        type: "success",
        title: `${view.name} moved to trash`,
        actionProps: { children: "Undo", onClick: () => void restore(view.id, view.name) },
      });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) deleteView.reset();
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {view.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {view.name} will move to the trash, where you can restore it for {TRASH_RETENTION_DAYS}{" "}
            days. The records in the table are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteView.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteView.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteView.isPending}
            onClick={() => deleteView.mutate({ workspace, tableId, viewId: view.id })}
          >
            Delete view
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
