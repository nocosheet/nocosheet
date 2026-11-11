import { useState } from "react";

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { ApiError } from "@/data/workspace/api-error";
import { workspaceKeys } from "@/data/workspace/keys";
import { tableQueryOptions } from "@/data/workspace/tables";
import {
  restoreRecordMutationOptions,
  trashEntryQueryOptions,
  type RestoreFailure,
} from "@/data/workspace/trash";
import { buildCreate, buildPatch, toFormValues } from "@/lib/records/form";

import { buildViewerColumns, type ViewerColumn } from "../columns";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function RestoreForm({
  workspace,
  tableId,
  tableName,
  entryId,
  record,
  columns,
  failure,
  onRestored,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  entryId: number;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
  failure?: RestoreFailure;
  onRestored: () => void;
}) {
  const queryClient = useQueryClient();
  const [initial] = useState(() => toFormValues(columns, record));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>(
    failure?.field ? { [failure.field]: failure.message } : {},
  );

  const restore = useMutation({
    ...restoreRecordMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({ type: "success", title: "Record restored" });
      onRestored();
    },
    onError: (error) =>
      setFieldErrors(
        error instanceof ApiError && error.field ? { [error.field]: error.message } : {},
      ),
  });

  const form = useRecordForm({
    initial,
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) => {
      setFieldErrors({});
      restore.mutate({
        workspace,
        tableId,
        entryId,
        values: buildPatch(columns, value, initial).patch,
      });
    },
  });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      record={record}
      recordId={String(record.id)}
      status="In trash"
      error={restore.error ?? (failure ? new Error(failure.message) : null)}
      fieldErrors={fieldErrors}
      onFieldEdit={(key) =>
        setFieldErrors((current) => {
          if (!(key in current)) return current;
          const { [key]: _removed, ...rest } = current;
          return rest;
        })
      }
    >
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button type="submit" loading={restore.isPending}>
          Restore record
        </Button>
      </SheetFooter>
    </RecordForm>
  );
}

export function RestoreRecordSheet({
  workspace,
  tableId,
  entryId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  entryId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [failure] = useState(() =>
    queryClient.getQueryData<RestoreFailure>(workspaceKeys.restoreError(tableId, entryId)),
  );
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const { data: entry, error } = useQuery(trashEntryQueryOptions(workspace, tableId, entryId));

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup className="max-w-xl">
        {entry ? (
          <RestoreForm
            key={entryId}
            workspace={workspace}
            tableId={tableId}
            tableName={table.name}
            entryId={entryId}
            record={entry.record}
            columns={buildViewerColumns(table)}
            failure={failure}
            onRestored={() => setOpen(false)}
          />
        ) : (
          <RecordSheetSkeleton title="Restore record" tableName={table.name} error={error} />
        )}
      </SheetPopup>
    </Sheet>
  );
}
