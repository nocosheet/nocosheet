import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { workspaceKeys } from "@/data/workspace/keys";
import { createColumnsMutationOptions, deleteTableMutationOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import { FORMATS, TITLE_FORMATS } from "@/lib/tables/formats";
import { toColumnName } from "@/lib/tables/naming";

import { ColumnDialog } from "./column-dialog";
import { type ColumnDraft } from "./column-draft";
import { NamedIcon } from "./named-icon";
import { TitleSelect } from "./title-select";
import { WizardFooter, WizardPanel } from "./wizard-panel";

export function ColumnsStep({
  tableId,
  tableName,
  onDiscarded,
  onFinished,
}: {
  tableId: number;
  tableName: string;
  onDiscarded: () => void;
  onFinished: () => void;
}) {
  const queryClient = useQueryClient();
  const { id: workspace } = useWorkspace();
  const [columns, setColumns] = useState<ColumnDraft[]>([]);
  const [titleKey, setTitleKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; index: number | null; key: number }>({
    open: false,
    index: null,
    key: 0,
  });
  const openDialog = (index: number | null) =>
    setDialog((current) => ({ open: true, index, key: current.key + 1 }));

  const createColumns = useMutation({
    ...createColumnsMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      toastManager.add({ type: "success", title: `${tableName} was created` });
      onFinished();
    },
  });

  const discardTable = useMutation({
    ...deleteTableMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      onDiscarded();
    },
  });

  const titleOptions = columns
    .filter((column) => TITLE_FORMATS.includes(column.format))
    .map((column) => ({ value: toColumnName(column.name), label: column.name }));
  const activeTitle = titleOptions.some((option) => option.value === titleKey) ? titleKey : null;

  const editing = dialog.index === null ? null : (columns[dialog.index] ?? null);

  const save = (draft: ColumnDraft) => {
    const previous = dialog.index === null ? null : columns[dialog.index];
    const key = toColumnName(draft.name);
    setColumns((current) =>
      dialog.index === null
        ? [...current, draft]
        : current.map((item, index) => (index === dialog.index ? draft : item)),
    );
    if (previous && toColumnName(previous.name) === titleKey) setTitleKey(key);
    else if (!activeTitle && draft.format === "text") setTitleKey(key);
  };

  const remove = (index: number) => {
    setColumns((current) => current.filter((_, i) => i !== index));
  };

  const finish = () => {
    if (columns.length === 0) return onFinished();
    createColumns.mutate({
      workspace,
      id: tableId,
      columns: columns.map((column, position) => ({ ...column, position })),
      titleColumn: activeTitle,
    });
  };

  return (
    <>
      <WizardPanel
        step={2}
        title="Columns"
        description="Your table already has its id and tracking columns. Add the columns that hold your data."
        action={
          <Button size="sm" onClick={() => openDialog(null)}>
            <PlusIcon />
            Add column
          </Button>
        }
      >
        {columns.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            No columns yet. You can finish now and add them later.
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {columns.map((column, index) => {
              const FormatIcon = FORMATS[column.format].icon;
              return (
                <div key={`${column.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  {column.icon ? (
                    <NamedIcon
                      name={column.icon}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <FormatIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-sm">{column.name}</span>
                    <span className="truncate text-muted-foreground text-xs">
                      {FORMATS[column.format].label} · {toColumnName(column.name)}
                    </span>
                  </div>
                  <div className="hidden items-center gap-1 sm:flex">
                    {column.isRequired && <Badge variant="outline">Required</Badge>}
                    {column.isUnique && <Badge variant="outline">Unique</Badge>}
                    {column.isHidden && <Badge variant="outline">Hidden</Badge>}
                    {column.generatedExpression && <Badge variant="outline">Computed</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${column.name}`}
                    onClick={() => openDialog(index)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${column.name}`}
                    onClick={() => remove(index)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {createColumns.error && (
          <Alert variant="error">
            <AlertDescription>{createColumns.error.message}</AlertDescription>
          </Alert>
        )}
        {titleOptions.length > 0 && (
          <TitleSelect options={titleOptions} value={activeTitle} onValueChange={setTitleKey} />
        )}
      </WizardPanel>
      <WizardFooter hint="Columns are created when you finish.">
        <Button
          variant="outline"
          onClick={() => discardTable.mutate({ workspace, id: tableId })}
          loading={discardTable.isPending}
          disabled={createColumns.isPending}
        >
          Discard
        </Button>
        <Button
          onClick={finish}
          loading={createColumns.isPending}
          disabled={discardTable.isPending}
        >
          Finish
        </Button>
      </WizardFooter>

      <ColumnDialog
        formKey={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        initial={editing}
        takenNames={columns
          .filter((_, index) => index !== dialog.index)
          .map((column) => toColumnName(column.name))}
        onSave={save}
      />
    </>
  );
}
