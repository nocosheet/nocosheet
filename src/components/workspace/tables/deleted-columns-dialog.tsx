import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedColumnsQueryOptions,
  purgeColumnMutationOptions,
  restoreColumnMutationOptions,
} from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";

export function DeletedColumnsDialog({
  workspace,
  tableId,
  open,
  onOpenChange,
}: {
  workspace: string;
  tableId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ ...deletedColumnsQueryOptions(workspace, tableId), enabled: open });
  const [confirming, setConfirming] = useState<number | null>(null);

  const refresh = async () => {
    setConfirming(null);
    await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
  };

  const restore = useMutation({ ...restoreColumnMutationOptions, onSuccess: refresh });
  const purge = useMutation({ ...purgeColumnMutationOptions, onSuccess: refresh });
  const error = restore.error ?? purge.error;
  const rows = data?.rows ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setConfirming(null);
          restore.reset();
          purge.reset();
        }
      }}
    >
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deleted columns</DialogTitle>
          <DialogDescription>
            Deleted columns keep their values for {TRASH_RETENTION_DAYS} days. Restore one to bring
            it back with its data.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-2">
          {error && (
            <Alert variant="error">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
          {rows.length === 0 && (
            <p className="py-6 text-center text-muted-foreground text-sm">No deleted columns.</p>
          )}
          {rows.map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{column.name}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {column.format.replaceAll("_", " ")}
                  {column.deletedBy?.label ? ` · deleted by ${column.deletedBy.label}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={restore.isPending && restore.variables?.columnId === column.id}
                  onClick={() => restore.mutate({ workspace, id: tableId, columnId: column.id })}
                >
                  Restore
                </Button>
                <Button
                  size="sm"
                  variant={confirming === column.id ? "destructive" : "ghost"}
                  loading={purge.isPending && purge.variables?.columnId === column.id}
                  onClick={() =>
                    confirming === column.id
                      ? purge.mutate({ workspace, id: tableId, columnId: column.id })
                      : setConfirming(column.id)
                  }
                >
                  {confirming === column.id ? "Confirm" : "Delete forever"}
                </Button>
              </div>
            </div>
          ))}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
