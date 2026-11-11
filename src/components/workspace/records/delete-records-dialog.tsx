import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TrashIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { deleteRecordsMutationOptions } from "@/data/workspace/records";

export function DeleteRecordsDialog({
  workspace,
  tableId,
  ids,
  label,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  ids: (string | number)[];
  label?: string;
  onDeleted: (count: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const count = ids.length;
  const noun = count === 1 ? "record" : "records";

  const deleteRecords = useMutation({
    ...deleteRecordsMutationOptions,
    onSuccess: async () => {
      setOpen(false);
      onDeleted(count);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.table(tableId),
        predicate: (query) => query.queryKey[3] !== "record",
      });
      for (const id of ids)
        queryClient.removeQueries({ queryKey: workspaceKeys.record(tableId, String(id)) });
      toastManager.add({ type: "success", title: `${count} ${noun} deleted` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) deleteRecords.reset();
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        <TrashIcon />
        {label ?? `Delete ${count}`}
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {noun}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the selected {noun}. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteRecords.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteRecords.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteRecords.isPending}
            onClick={() => deleteRecords.mutate({ workspace, tableId, ids })}
          >
            Delete {noun}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
