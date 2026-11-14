import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TrashIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCreateHandle,
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

import { useRestoreRecord } from "./use-restore-record";

export type DeleteRecordsPayload = { ids: (string | number)[] };

export const createDeleteRecordsHandle = () => AlertDialogCreateHandle<DeleteRecordsPayload>();

type DeleteRecordsProps = {
  workspace: string;
  tableId: number;
  onDeleted: (count: number) => void;
};

function DeleteRecordsPopup({
  workspace,
  tableId,
  ids,
  onDeleted,
  onClose,
}: DeleteRecordsProps & { ids: (string | number)[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const restore = useRestoreRecord(workspace, tableId);
  const count = ids.length;
  const noun = count === 1 ? "record" : "records";

  const deleteRecords = useMutation({
    ...deleteRecordsMutationOptions,
    onSuccess: async (result) => {
      onClose();
      onDeleted(count);
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.table(tableId),
        predicate: (query) => query.queryKey[3] !== "record",
      });
      for (const id of ids)
        queryClient.removeQueries({ queryKey: workspaceKeys.record(tableId, String(id)) });
      toastManager.add({
        type: "success",
        title: `${count} ${noun} moved to trash`,
        actionProps: { children: "Undo", onClick: () => void restore(result.trash) },
      });
    },
  });

  return (
    <AlertDialogPopup>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Delete {count} {noun}?
        </AlertDialogTitle>
        <AlertDialogDescription>
          The selected {noun} will move to the trash, where you can restore{" "}
          {count === 1 ? "it" : "them"}.
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
  );
}

export function DeleteRecordsDialog({
  label,
  ids,
  ...props
}: DeleteRecordsProps & { ids: (string | number)[]; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
        <TrashIcon />
        {label ?? `Delete ${ids.length}`}
      </AlertDialogTrigger>
      <DeleteRecordsPopup {...props} ids={ids} onClose={() => setOpen(false)} />
    </AlertDialog>
  );
}

export function DetachedDeleteRecordsDialog({
  handle,
  ...props
}: DeleteRecordsProps & { handle: ReturnType<typeof createDeleteRecordsHandle> }) {
  return (
    <AlertDialog handle={handle}>
      {({ payload }) => (
        <DeleteRecordsPopup {...props} ids={payload?.ids ?? []} onClose={() => handle.close()} />
      )}
    </AlertDialog>
  );
}
