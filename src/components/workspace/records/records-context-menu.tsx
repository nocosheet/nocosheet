import { useRef, useState } from "react";

import {
  BracesIcon,
  CopyIcon,
  HashIcon,
  PanelRightOpenIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import type { CellMouseArgs } from "react-data-grid";

import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toastManager } from "@/components/ui/toast";

import { cellText } from "./cell-text";
import { cellMode } from "./cells";
import type { ViewerColumn } from "./columns";
import { createDeleteRecordsHandle, DetachedDeleteRecordsDialog } from "./delete-records-dialog";
import type { ViewerRow } from "./records-grid-columns";

type Target = {
  row: ViewerRow;
  column: ViewerColumn | null;
  edit: () => void;
};

export type CellContextMenuHandler = (args: CellMouseArgs<ViewerRow>) => void;

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toastManager.add({ type: "success", title: `${label} copied` });
  } catch {
    toastManager.add({ type: "error", title: `Couldn't copy ${label.toLowerCase()}` });
  }
};

export function RecordsContextMenu({
  workspace,
  tableId,
  columns,
  canEditRow,
  canDeleteRow,
  onOpenRecord,
  onDeleted,
  children,
}: {
  workspace: string;
  tableId: number;
  columns: ViewerColumn[];
  canEditRow: (row: ViewerRow) => boolean;
  canDeleteRow: (row: ViewerRow) => boolean;
  onOpenRecord?: (id: number) => void;
  onDeleted: (count: number) => void;
  children: (onCellContextMenu: CellContextMenuHandler) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target | null>(null);
  const [deleteHandle] = useState(createDeleteRecordsHandle);
  const pending = useRef<Target | null>(null);

  const handleCell: CellContextMenuHandler = ({ row, column, setActivePosition }) => {
    pending.current = {
      row,
      column: columns.find((item) => item.key === column.key) ?? null,
      edit: () => setActivePosition({ enableEditor: true }),
    };
  };

  const column = target?.column ?? null;
  const row = target?.row;
  const mode = column ? cellMode(column) : "readonly";
  const editable = !!row && !!column && canEditRow(row) && (mode === "input" || mode === "popup");
  const valueText = row && column ? cellText(row[column.key]) : "";

  return (
    <>
      <ContextMenu
        open={open}
        onOpenChange={(next) => {
          if (next) {
            if (!pending.current) return;
            setTarget(pending.current);
          }
          setOpen(next);
        }}
      >
        <ContextMenuTrigger
          render={
            <div
              className="contents"
              onContextMenuCapture={() => {
                pending.current = null;
              }}
            />
          }
        >
          {children(handleCell)}
        </ContextMenuTrigger>
        <ContextMenuPopup finalFocus={false} align="start" side="right" className="min-w-52">
          {row && (
            <>
              {onOpenRecord && (
                <ContextMenuItem onClick={() => onOpenRecord(row.id)}>
                  <PanelRightOpenIcon />
                  Open record
                </ContextMenuItem>
              )}
              {editable && (
                <ContextMenuItem onClick={() => setTimeout(() => target?.edit(), 0)}>
                  <PencilIcon />
                  Edit cell
                </ContextMenuItem>
              )}
              {(onOpenRecord || editable) && <ContextMenuSeparator />}

              {column && (
                <ContextMenuItem
                  disabled={valueText === ""}
                  onClick={() => void copy(valueText, "Value")}
                >
                  <CopyIcon />
                  Copy value
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={() => void copy(String(row.id), "Record ID")}>
                <HashIcon />
                Copy record ID
              </ContextMenuItem>
              <ContextMenuItem onClick={() => void copy(JSON.stringify(row, null, 2), "Record")}>
                <BracesIcon />
                Copy record as JSON
              </ContextMenuItem>

              {canDeleteRow(row) && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    render={
                      <AlertDialogTrigger handle={deleteHandle} payload={{ ids: [row.id] }} />
                    }
                  >
                    <TrashIcon />
                    Delete record
                  </ContextMenuItem>
                </>
              )}
            </>
          )}
        </ContextMenuPopup>
      </ContextMenu>

      <DetachedDeleteRecordsDialog
        handle={deleteHandle}
        workspace={workspace}
        tableId={tableId}
        onDeleted={onDeleted}
      />
    </>
  );
}
