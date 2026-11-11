import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ViewerRow } from "./records-grid";
import { useExportRecords } from "./use-export-records";

export function RecordExport({
  workspace,
  tableId,
  selected,
}: {
  workspace: string;
  tableId: number;
  selected: ViewerRow[];
}) {
  const exportRecords = useExportRecords(workspace, tableId);

  return (
    <Button
      variant="outline"
      loading={exportRecords.isPending}
      onClick={() => exportRecords.mutate(selected)}
    >
      <DownloadIcon />
      Export {selected.length}
    </Button>
  );
}
