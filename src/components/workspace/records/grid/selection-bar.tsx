import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DeleteRecordsDialog } from "../delete-records-dialog";
import { RecordExport } from "../record-export";
import type { ViewerRow } from "../records-grid";
import type { GridTable } from "./use-grid-table";
import type { RecordsQuery, SetRecordsQuery } from "./use-records-query";

export function SelectionBar({
  workspace,
  tableId,
  select,
  grid,
  selected,
  total,
  query,
  setQuery,
}: {
  workspace: string;
  tableId: number;
  select: { canExport: boolean; canDelete: (row: ViewerRow) => boolean };
  grid: GridTable;
  selected: ViewerRow[];
  total: number;
  query: RecordsQuery;
  setQuery: SetRecordsQuery;
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
              const lastPage = Math.max(1, Math.ceil((total - deleted) / query.pageSize));
              if (query.page > lastPage) void setQuery({ page: lastPage });
            }}
          />
        )}
      </div>
    </div>
  );
}
