import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Undo2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { PurgeDialog } from "@/components/workspace/trash/purge-dialog";
import { TrashRows } from "@/components/workspace/trash/trash-rows";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  deletedColumnsQueryOptions,
  purgeColumnMutationOptions,
  restoreColumnMutationOptions,
} from "@/data/workspace/tables";
import { TRASH_RETENTION_DAYS } from "@/lib/records/retention";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DeletedColumnsSheet({
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
  const { data, isPending, error } = useQuery({
    ...deletedColumnsQueryOptions(workspace, tableId),
    enabled: open,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
  const restore = useMutation({ ...restoreColumnMutationOptions, onSuccess: refresh });
  const purge = useMutation({ ...purgeColumnMutationOptions, onSuccess: refresh });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          restore.reset();
          purge.reset();
        }
      }}
    >
      <SheetPopup className="max-w-3xl">
        <SheetHeader>
          <SheetTitle>Deleted columns</SheetTitle>
          <SheetDescription>
            Deleted columns keep their values for {TRASH_RETENTION_DAYS} days. Restore one to bring
            it back with its data.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-3">
          {restore.error && (
            <Alert variant="error">
              <AlertDescription>{restore.error.message}</AlertDescription>
            </Alert>
          )}
          <TrashRows
            rows={data?.rows}
            nameLabel="Column"
            loading={isPending && open}
            error={error}
            emptyDescription={`Deleted columns stay here for ${TRASH_RETENTION_DAYS} days so you can restore them, then they're deleted forever.`}
            detail={(row) => (
              <span className="truncate text-muted-foreground text-xs">
                {row.format.replaceAll("_", " ")}
              </span>
            )}
            actions={(row) => (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  loading={restore.isPending && restore.variables?.columnId === row.id}
                  onClick={() => restore.mutate({ workspace, id: tableId, columnId: row.id })}
                >
                  <Undo2Icon />
                  Restore
                </Button>
                <PurgeDialog
                  label={row.name}
                  description={`"${row.name}" and all of its values will be removed for good and can't be restored.`}
                  pending={purge.isPending}
                  error={purge.error}
                  onReset={() => purge.reset()}
                  onConfirm={(done) =>
                    purge.mutate({ workspace, id: tableId, columnId: row.id }, { onSuccess: done })
                  }
                />
              </>
            )}
          />
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}
