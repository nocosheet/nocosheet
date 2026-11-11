import { PencilIcon, TrashIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORMATS, type ColumnFormat } from "@/lib/tables/formats";

import { NamedIcon } from "./named-icon";

type ListColumn = {
  id: number;
  name: string;
  columnName: string;
  format: string;
  icon: string | null;
  isRequired: boolean;
  isUnique: boolean;
  isHidden: boolean;
  generatedExpression: string | null;
};

export function ColumnsList<T extends ListColumn>({
  columns,
  titleColumnId,
  empty,
  onEdit,
  onDelete,
}: {
  columns: T[];
  titleColumnId: number | null;
  empty: string;
  onEdit?: (column: T) => void;
  onDelete?: (column: T) => void;
}) {
  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        {empty}
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {columns.map((column) => {
        const format = FORMATS[column.format as ColumnFormat];
        return (
          <div key={column.id} className="flex items-center gap-3 px-4 py-3">
            <NamedIcon
              name={column.icon}
              fallback={format.icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-sm">{column.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {format.label} · {column.columnName}
              </span>
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              {column.id === titleColumnId && <Badge>Title</Badge>}
              {column.isRequired && <Badge variant="outline">Required</Badge>}
              {column.isUnique && <Badge variant="outline">Unique</Badge>}
              {column.isHidden && <Badge variant="outline">Hidden</Badge>}
              {column.generatedExpression && <Badge variant="outline">Computed</Badge>}
            </div>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${column.name}`}
                onClick={() => onEdit(column)}
              >
                <PencilIcon />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${column.name}`}
                onClick={() => onDelete(column)}
              >
                <TrashIcon />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
