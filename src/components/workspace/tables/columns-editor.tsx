import { useState } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workspaceKeys } from "@/data/workspace/keys";
import {
  createColumnMutationOptions,
  deleteColumnMutationOptions,
  tableQueryOptions,
  updateColumnMutationOptions,
} from "@/data/workspace/tables";
import { FORMATS, type ColumnFormat } from "@/lib/tables/formats";

import { ColumnDialog } from "./column-dialog";
import { columnToDraft, type ColumnDraft } from "./column-draft";
import { NamedIcon } from "./named-icon";

function useTableData(workspace: string, tableId: number) {
  return useSuspenseQuery(tableQueryOptions(workspace, tableId));
}

type EditorColumn = ReturnType<typeof useTableData>["data"]["columns"][number];

export function ColumnsEditor({ workspace, tableId }: { workspace: string; tableId: number }) {
  const queryClient = useQueryClient();
  const { data: table } = useTableData(workspace, tableId);
  const columns = table.columns;

  const [dialog, setDialog] = useState<{ open: boolean; column: EditorColumn | null; key: number }>(
    { open: false, column: null, key: 0 },
  );
  const [removing, setRemoving] = useState<EditorColumn | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });

  const createColumn = useMutation({ ...createColumnMutationOptions, onSuccess: refresh });
  const updateColumn = useMutation({ ...updateColumnMutationOptions, onSuccess: refresh });
  const deleteColumn = useMutation({
    ...deleteColumnMutationOptions,
    onSuccess: async () => {
      await refresh();
      setRemoving(null);
    },
  });

  const openDialog = (column: EditorColumn | null) =>
    setDialog((current) => ({ open: true, column, key: current.key + 1 }));

  const nextPosition = columns.reduce((max, column) => Math.max(max, column.position), -1) + 1;

  const save = async (draft: ColumnDraft) => {
    if (dialog.column) {
      await updateColumn.mutateAsync({
        workspace,
        id: tableId,
        columnId: dialog.column.id,
        patch: {
          name: draft.name,
          description: draft.description,
          icon: draft.icon,
          isRequired: draft.isRequired,
          isFilterable: draft.isFilterable,
          isSortable: draft.isSortable,
          isSearchable: draft.isSearchable,
          isUnique: draft.isUnique,
          isHidden: draft.isHidden,
        },
      });
    } else {
      await createColumn.mutateAsync({
        workspace,
        id: tableId,
        column: { ...draft, position: nextPosition },
      });
    }
  };

  const others = columns.filter((column) => column.id !== dialog.column?.id);
  const taken = dialog.column
    ? others.map((column) => column.name.toLowerCase())
    : [
        ...others.map((column) => column.name.toLowerCase()),
        ...others.map((column) => column.columnName),
      ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {columns.length} {columns.length === 1 ? "column" : "columns"}
        </p>
        <Button size="sm" onClick={() => openDialog(null)}>
          <PlusIcon />
          Add column
        </Button>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          No columns yet. Add the columns that hold your data.
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {columns.map((column) => {
            const FormatIcon = FORMATS[column.format as ColumnFormat].icon;
            return (
              <div key={column.id} className="flex items-center gap-3 px-4 py-3">
                {column.icon ? (
                  <NamedIcon name={column.icon} className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <FormatIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm">{column.name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {FORMATS[column.format as ColumnFormat].label} · {column.columnName}
                  </span>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  {column.id === table.titleColumnId && <Badge>Title</Badge>}
                  {column.isRequired && <Badge variant="outline">Required</Badge>}
                  {column.isUnique && <Badge variant="outline">Unique</Badge>}
                  {column.isHidden && <Badge variant="outline">Hidden</Badge>}
                  {column.generatedExpression && <Badge variant="outline">Computed</Badge>}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${column.name}`}
                  onClick={() => openDialog(column)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${column.name}`}
                  onClick={() => setRemoving(column)}
                >
                  <TrashIcon />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <ColumnDialog
        formKey={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        initial={dialog.column ? columnToDraft(dialog.column) : null}
        storedName={dialog.column?.columnName}
        taken={taken}
        onSave={save}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            deleteColumn.reset();
          }
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the column and every value stored in it. This can't be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteColumn.error && (
            <div className="px-6 pb-2">
              <Alert variant="error">
                <AlertDescription>{deleteColumn.error.message}</AlertDescription>
              </Alert>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
            <Button
              variant="destructive"
              loading={deleteColumn.isPending}
              onClick={() =>
                removing && deleteColumn.mutate({ workspace, id: tableId, columnId: removing.id })
              }
            >
              Delete column
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
