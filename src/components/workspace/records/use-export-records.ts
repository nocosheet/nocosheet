import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { recordsExportQueryOptions } from "@/data/workspace/records";
import { tableQueryOptions } from "@/data/workspace/tables";
import { downloadCsv, recordsToCsv } from "@/lib/records/export";
import { toSlug } from "@/lib/tables/naming";

import { buildViewerColumns } from "./columns";
import type { ViewerRow } from "./records-grid";

export function useExportRecords(workspace: string, tableId: number) {
  const queryClient = useQueryClient();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));

  return useMutation({
    mutationFn: async (selected?: ViewerRow[]) => {
      const { rows, truncated } = selected
        ? { rows: selected, truncated: false }
        : await queryClient.query(recordsExportQueryOptions(workspace, tableId));
      downloadCsv(toSlug(table.name) || "records", recordsToCsv(buildViewerColumns(table), rows));
      return { count: rows.length, truncated };
    },
    onSuccess: ({ count, truncated }) =>
      toastManager.add({
        type: "success",
        title: `Exported ${count} ${count === 1 ? "record" : "records"}`,
        description: truncated ? `Export is limited to ${count} records.` : undefined,
      }),
    onError: (error) =>
      toastManager.add({ type: "error", title: "Export failed", description: error.message }),
  });
}
