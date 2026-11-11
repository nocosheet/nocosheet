import { Badge } from "@/components/ui/badge";

import { RelationCombobox } from "../relation-combobox";
import { text } from "./shared";
import type { CellProps, EditorProps } from "./types";

export function RelationCell({ value }: CellProps) {
  const label = (value as { label?: string | null }).label;
  return <Badge variant="outline">{label ?? `#${text((value as { id?: unknown }).id)}`}</Badge>;
}

export function RelationEditor({ workspace, row, column, onRowChange, onClose }: EditorProps) {
  const current = row[column.key] as { id: string | number; label: string | null } | null;

  return (
    <RelationCombobox
      defaultOpen
      cell
      workspace={workspace}
      column={column}
      value={current ? String(current.id) : ""}
      current={current}
      onClose={() => onClose(false, true)}
      onChange={(item) =>
        onRowChange(
          { ...row, [column.key]: item ? { id: item.id, label: item.label } : null },
          true,
        )
      }
    />
  );
}
