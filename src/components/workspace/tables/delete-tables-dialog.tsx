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
import { deleteTablesMutationOptions } from "@/data/workspace/tables";

export function DeleteTablesDialog({
  workspace,
  ids,
  label,
  size,
  onDeleted,
}: {
  workspace: string;
  ids: number[];
  label?: string;
  size?: "default" | "sm";
  onDeleted: (count: number) => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const count = ids.length;
  const noun = count === 1 ? "table" : "tables";

  const deleteTables = useMutation({
    ...deleteTablesMutationOptions,
    onSuccess: async () => {
      setOpen(false);
      await onDeleted(count);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      toastManager.add({ type: "success", title: `${count} ${noun} deleted` });
    },
  });

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) deleteTables.reset();
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive-outline" size={size} />}>
        <TrashIcon />
        {label ?? `Delete (${count})`}
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {noun}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1
              ? "This permanently deletes the selected table along with its columns, views, widgets and every record. This can't be undone."
              : "This permanently deletes the selected tables along with their columns, views, widgets and every record. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteTables.error && (
          <div className="px-6 pb-2">
            <Alert variant="error">
              <AlertDescription>{deleteTables.error.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            loading={deleteTables.isPending}
            onClick={() => deleteTables.mutate({ workspace, ids })}
          >
            Delete {noun}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
