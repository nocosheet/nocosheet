import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast";
import { recordQueryOptions, updateRecordMutationOptions } from "@/data/workspace/records";

import type { ViewerColumn } from "./columns";
import type { ViewerRow } from "./records-grid";

type Page = { rows: ViewerRow[]; total: number };

const payloadOf = (column: ViewerColumn, value: unknown) => {
  if (value === undefined || value === "") return null;
  if (column.format === "relation") return (value as { id: string | number } | null)?.id ?? null;
  return value;
};

export function useUpdateCell({
  workspace,
  tableId,
  queryKey,
}: {
  workspace: string;
  tableId: number;
  queryKey: readonly unknown[];
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation(updateRecordMutationOptions);

  const replaceRow = (recordId: string, next: ViewerRow) =>
    queryClient.setQueryData<Page>(queryKey, (page) =>
      page
        ? { ...page, rows: page.rows.map((row) => (String(row.id) === recordId ? next : row)) }
        : page,
    );

  return async (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => {
    if (JSON.stringify(original[column.key]) === JSON.stringify(draft[column.key])) return;

    const value = payloadOf(column, draft[column.key]);
    if (value === null && column.required)
      return toastManager.add({ type: "error", title: `${column.name} is required` });
    if (typeof value === "number" && Number.isNaN(value))
      return toastManager.add({ type: "error", title: `${column.name} must be a number` });

    const recordId = String(original.id);
    await queryClient.cancelQueries({ queryKey });
    replaceRow(recordId, draft);

    try {
      await mutation.mutateAsync({
        workspace,
        tableId,
        recordId,
        values: { [column.key]: value },
      });
      await queryClient.invalidateQueries({
        queryKey: recordQueryOptions(workspace, tableId, recordId).queryKey,
      });
    } catch (error) {
      replaceRow(recordId, original);
      toastManager.add({
        type: "error",
        title: `Couldn't save ${column.name}`,
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };
}
