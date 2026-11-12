import { useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetFooter, SheetPopup } from "@/components/ui/sheet";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { createRecordMutationOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { buildCreate, toDefaultFormValues } from "@/lib/records/form";

import { buildViewColumns, buildViewerColumns, type ViewerColumn, type ViewScope } from "../columns";
import { RecordForm } from "./record-form";
import { useRecordForm } from "./use-record-form";

function CreateForm({
  workspace,
  tableId,
  tableName,
  columns,
  onCreated,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  columns: ViewerColumn[];
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();

  const create = useMutation({
    ...createRecordMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.table(tableId) });
      toastManager.add({ type: "success", title: "Record created" });
      onCreated();
    },
  });

  const form = useRecordForm({
    initial: toDefaultFormValues(columns),
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) =>
      create.mutate({ workspace, tableId, values: buildCreate(columns, value).payload }),
  });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      error={create.error}
    >
      <SheetFooter>
        <SheetClose render={<Button type="button" variant="ghost" />}>Cancel</SheetClose>
        <Button type="submit" loading={create.isPending}>
          Create record
        </Button>
      </SheetFooter>
    </RecordForm>
  );
}

export function CreateRecordSheet({
  workspace,
  tableId,
  view,
  onClose,
}: {
  workspace: string;
  tableId: number;
  view?: ViewScope;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetPopup className="max-w-xl">
        <CreateForm
          workspace={workspace}
          tableId={tableId}
          tableName={table.name}
          columns={view ? buildViewColumns(table, view.selectColumns) : buildViewerColumns(table)}
          onCreated={() => setOpen(false)}
        />
      </SheetPopup>
    </Sheet>
  );
}
