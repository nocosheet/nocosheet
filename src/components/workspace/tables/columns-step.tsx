import { useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  discardTableMutationOptions,
  tableQueryOptions,
  updateTableMutationOptions,
} from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { TITLE_FORMATS } from "@/lib/tables/formats";

import { ColumnsEditor } from "./columns-editor";
import { TitleSelect } from "./title-select";
import { WizardFooter, WizardPanel } from "./wizard-panel";

export function ColumnsStep({
  tableId,
  onDiscarded,
  onFinished,
}: {
  tableId: number;
  onDiscarded: () => void;
  onFinished: () => void;
}) {
  const queryClient = useQueryClient();
  const { id: workspace } = useWorkspace();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const [choice, setChoice] = useState<string | null | undefined>(undefined);

  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });

  const updateTable = useMutation({
    ...updateTableMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: `${table.name} was created` });
      onFinished();
    },
  });

  const discardTable = useMutation({
    ...discardTableMutationOptions,
    onSuccess: async () => {
      await refresh();
      onDiscarded();
    },
  });

  const titleOptions = table.columns
    .filter((column) => TITLE_FORMATS.includes(column.format as never))
    .map((column) => ({ value: column.columnName, label: column.name }));
  const savedTitle = table.columns.find((column) => column.id === table.titleColumnId)?.columnName;
  const firstText = table.columns.find((column) => column.format === "text")?.columnName;
  const preferred = choice !== undefined ? choice : (savedTitle ?? firstText ?? null);
  const activeTitle = titleOptions.some((option) => option.value === preferred) ? preferred : null;

  const finish = () => {
    if (activeTitle === (savedTitle ?? null)) {
      toastManager.add({ type: "success", title: `${table.name} was created` });
      return onFinished();
    }
    updateTable.mutate({ workspace, id: tableId, values: { titleColumn: activeTitle } });
  };

  const error = updateTable.error ?? discardTable.error;

  return (
    <>
      <WizardPanel
        step={2}
        title="Columns"
        description="Your table already has its id and tracking columns. Each column is saved as soon as you add it."
      >
        <ColumnsEditor workspace={workspace} tableId={tableId} />
        {titleOptions.length > 0 && (
          <TitleSelect options={titleOptions} value={activeTitle} onValueChange={setChoice} />
        )}
        {error && (
          <Alert variant="error">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </WizardPanel>
      <WizardFooter hint="Finish saves the title column.">
        <Button
          variant="outline"
          onClick={() => discardTable.mutate({ workspace, id: tableId })}
          loading={discardTable.isPending}
          disabled={updateTable.isPending}
        >
          Discard
        </Button>
        <Button onClick={finish} loading={updateTable.isPending} disabled={discardTable.isPending}>
          Finish
        </Button>
      </WizardFooter>
    </>
  );
}
