import { useState } from "react";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { Sheet, SheetPopup } from "@/components/ui/sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { toFormValues } from "@/lib/records/form";

import { buildViewerColumns, type ViewerColumn } from "../columns";
import { RecordForm } from "./record-form";
import { RecordSheetSkeleton } from "./skeleton";
import { useRecordForm } from "./use-record-form";

function DetailForm({
  workspace,
  tableId,
  tableName,
  recordId,
  record,
  columns,
}: {
  workspace: string;
  tableId: number;
  tableName: string;
  recordId: string;
  record: Record<string, unknown>;
  columns: ViewerColumn[];
}) {
  const form = useRecordForm({ initial: toFormValues(columns, record) });

  return (
    <RecordForm
      form={form}
      workspace={workspace}
      tableId={tableId}
      tableName={tableName}
      columns={columns}
      record={record}
      recordId={recordId}
      disabled
      status="View only"
    />
  );
}

export function DetailRecordSheet({
  workspace,
  tableId,
  recordId,
  onClose,
}: {
  workspace: string;
  tableId: number;
  recordId: string;
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
          <DetailForm
            key={recordId}
            workspace={workspace}
            tableId={tableId}
            tableName={table.name}
            recordId={recordId}
            record={record}
            columns={buildViewerColumns(table)}
          />
        ) : (
          <RecordSheetSkeleton title={`Record ${recordId}`} tableName={table.name} error={error} />
        )}
      </SheetPopup>
    </Sheet>
  );
}
