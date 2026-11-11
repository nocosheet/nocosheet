import { useState } from "react";

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { recordQueryOptions, updateRecordMutationOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { buildPatch, toFormValues, type FormValues } from "@/lib/records/form";

import { buildViewerColumns, type ViewerColumn } from "../columns";
import { DeleteRecordsDialog } from "../delete-records-dialog";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function UpdateForm({
  workspace,
  tableId,
  tableName,
  recordId,
  record,
  columns,
  canDelete,
  onDeleted,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  recordId: string;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const [initial, setInitial] = useState<FormValues>(() => toFormValues(columns, record));

  const update = useMutation({
    ...updateRecordMutationOptions,
    onSuccess: async () => {
      const next = form.state.values;
      setInitial(next);
      form.reset(next);
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({ type: "success", title: "Record saved" });
    },
  });

  const form = useRecordForm({
    initial,
    validate: (value) => buildPatch(columns, value, initial).errors,
    onSubmit: (value) => {
      const { patch } = buildPatch(columns, value, initial);
      if (Object.keys(patch).length === 0) return;
      update.mutate({ workspace, tableId, recordId, values: patch });
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
      recordId={recordId}
      error={update.error}
    >
      <SheetFooter>
        {canDelete && (
          <div className="me-auto">
            <DeleteRecordsDialog
              workspace={workspace}
              tableId={tableId}
              ids={[recordId]}
              label="Delete"
              onDeleted={onDeleted}
            />
          </div>
        )}
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <form.Subscribe selector={(state) => state.isDirty}>
          {(dirty) => (
            <Button type="submit" disabled={!dirty} loading={update.isPending}>
              Save changes
            </Button>
          )}
        </form.Subscribe>
      </SheetFooter>
    </RecordForm>
  );
}

export function UpdateRecordSheet({
  workspace,
  tableId,
  recordId,
  canDelete = true,
  onClose,
}: {
  workspace: string;
  tableId: number;
  recordId: string;
  canDelete?: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const { data: record, error } = useQuery(recordQueryOptions(workspace, tableId, recordId));

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup className="max-w-xl">
        {record ? (
          <UpdateForm
            key={recordId}
            workspace={workspace}
            tableId={tableId}
            tableName={table.name}
            recordId={recordId}
            record={record}
            columns={buildViewerColumns(table)}
            canDelete={canDelete}
            onDeleted={() => setOpen(false)}
          />
        ) : (
          <RecordSheetSkeleton title={`Record ${recordId}`} tableName={table.name} error={error} />
        )}
      </SheetPopup>
    </Sheet>
  );
}
