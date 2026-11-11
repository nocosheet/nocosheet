import { GripVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { FORMATS, type ColumnFormat } from "@/lib/tables/formats";
import { cn } from "@/lib/utils";

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

const rowClass = "flex items-center gap-3 bg-background px-4 py-3";

function ColumnRow<T extends ListColumn>({
  column,
  titleColumnId,
  handle,
  onEdit,
  onDelete,
}: {
  column: T;
  titleColumnId: number | null;
  handle?: React.ReactNode;
  onEdit?: (column: T) => void;
  onDelete?: (column: T) => void;
}) {
  const format = FORMATS[column.format as ColumnFormat];

  return (
    <>
      {handle}
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
    </>
  );
}

export function ColumnsList<T extends ListColumn>({
  columns,
  titleColumnId,
  empty,
  onEdit,
  onDelete,
  onReorder,
}: {
  columns: T[];
  titleColumnId: number | null;
  empty: string;
  onEdit?: (column: T) => void;
  onDelete?: (column: T) => void;
  onReorder?: (columns: T[]) => void;
}) {
  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        {empty}
      </div>
    );
  }

  if (!onReorder)
    return (
      <div className="divide-y rounded-lg border">
        {columns.map((column) => (
          <div key={column.id} className={rowClass}>
            <ColumnRow
              column={column}
              titleColumnId={titleColumnId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    );

  return (
    <Sortable
      value={columns}
      onValueChange={onReorder}
      getItemValue={(column) => column.id}
      getItemLabel={(id) => columns.find((column) => column.id === id)?.name ?? String(id)}
    >
      <SortableContent className="divide-y overflow-hidden rounded-lg border">
        {columns.map((column) => (
          <SortableItem
            key={column.id}
            value={column.id}
            className={cn(rowClass, "data-dragging:opacity-40")}
          >
            <ColumnRow
              column={column}
              titleColumnId={titleColumnId}
              onEdit={onEdit}
              onDelete={onDelete}
              handle={
                <SortableItemHandle
                  aria-label={`Reorder ${column.name}`}
                  className="-ms-1 flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <GripVerticalIcon className="size-4" />
                </SortableItemHandle>
              }
            />
          </SortableItem>
        ))}
      </SortableContent>
      <SortableOverlay>
        {({ value }) => {
          const column = columns.find((item) => item.id === value);
          return column ? (
            <div className={cn(rowClass, "rounded-lg border shadow-lg")}>
              <ColumnRow
                column={column}
                titleColumnId={titleColumnId}
                handle={
                  <GripVerticalIcon className="-ms-1 size-4 shrink-0 text-muted-foreground" />
                }
              />
            </div>
          ) : null;
        }}
      </SortableOverlay>
    </Sortable>
  );
}
