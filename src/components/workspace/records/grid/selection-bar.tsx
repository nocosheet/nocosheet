import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DeleteRecordsDialog } from "../delete-records-dialog";
import { RecordExport } from "../record-export";
import type { ViewerRow } from "../records-grid";
import type { GridTable } from "./use-grid-table";
import type { RecordsPaging } from "./use-records-query";

export function SelectionBar({
  workspace,
  tableId,
  select,
  grid,
  selected,
  pageRows,
  paging,
}: {
  workspace: string;
  tableId: number;
  select: { canExport: boolean; canDelete: (row: ViewerRow) => boolean };
  grid: GridTable;
  selected: ViewerRow[];
  pageRows: number;
  paging: RecordsPaging;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
      <Button variant="outline" onClick={() => grid.resetRowSelection()}>
        <XIcon />
        {selected.length} selected
      </Button>
      <div className="ms-auto flex items-center gap-2">
        {select.canExport && (
          <RecordExport workspace={workspace} tableId={tableId} selected={selected} />
        )}
        {selected.every(select.canDelete) && (
          <DeleteRecordsDialog
            workspace={workspace}
            tableId={tableId}
            ids={selected.map((row) => row.id)}
            onDeleted={(deleted) => {
              grid.resetRowSelection();
              if (deleted >= pageRows && paging.canPrevious) paging.previous();
            }}
          />
        )}
      </div>
    </div>
  );
}
