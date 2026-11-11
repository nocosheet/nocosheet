import { ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { CellValue } from "./cells";
import type { ViewerColumn } from "./columns";

export type GroupRow = {
  __group: true;
  id: string;
  key: string;
  value: unknown;
  count: number;
  collapsed: boolean;
};

function GroupLabel({ column, row }: { column: ViewerColumn; row: GroupRow }) {
  if (column.format === "checkbox")
    return (
      <span className="flex items-center gap-2">
        <CellValue column={column} value={row.value === true} />
        {row.value === true ? "Checked" : "Unchecked"}
      </span>
    );

  if (row.key === "") return <span className="text-muted-foreground">No {column.name}</span>;

  return (
    <span className="flex min-w-0 items-center">
      <CellValue column={column} value={row.value} />
    </span>
  );
}

export function GroupHeader({
  column,
  row,
  onToggle,
}: {
  column: ViewerColumn;
  row: GroupRow;
  onToggle: (key: string) => void;
}) {
  return (
    <button
      type="button"
      className="records-group-toggle"
      aria-expanded={!row.collapsed}
      aria-label={`${row.collapsed ? "Expand" : "Collapse"} group`}
      onClick={() => onToggle(row.key)}
    >
      <ChevronDownIcon
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          row.collapsed && "-rotate-90",
        )}
      />
      <GroupLabel column={column} row={row} />
      <Badge variant="secondary" size="sm" className="tabular-nums">
        {row.count}
      </Badge>
    </button>
  );
}
