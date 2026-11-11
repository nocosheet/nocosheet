import { text } from "./shared";
import type { CellProps } from "./types";

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

const formatDateTime = (value: number | string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? text(value)
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export function DateCell({ column, value }: CellProps) {
  return (
    <span className="truncate">
      {column.format === "date"
        ? formatDate(text(value))
        : formatDateTime(value as number | string)}
    </span>
  );
}
