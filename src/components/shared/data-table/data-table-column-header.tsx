import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type SortableColumn = {
  getCanSort: () => boolean;
  getIsSorted: () => false | "asc" | "desc";
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
};

export function DataTableColumnHeader({
  column,
  title,
}: {
  column: SortableColumn;
  title: string;
}) {
  if (!column.getCanSort()) return <span>{title}</span>;

  const sorted = column.getIsSorted();
  const toggle = column.getToggleSortingHandler();
  const Icon = sorted === "asc" ? ChevronUpIcon : sorted === "desc" ? ChevronDownIcon : null;

  return (
    <div
      className="flex h-full cursor-pointer select-none items-center justify-between gap-2"
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle?.(event);
        }
      }}
    >
      {title}
      {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 opacity-80" />}
    </div>
  );
}
