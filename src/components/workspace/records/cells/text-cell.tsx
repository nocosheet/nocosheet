import { Link, Muted, text } from "./shared";
import type { CellProps } from "./types";

export function TextCell({ column, value }: CellProps) {
  switch (column.format) {
    case "id":
      return <Muted>{text(value)}</Muted>;
    case "email":
      return <Link href={`mailto:${text(value)}`}>{text(value)}</Link>;
    case "phone":
      return <Link href={`tel:${text(value)}`}>{text(value)}</Link>;
    case "url":
      return <Link href={text(value)}>{text(value).replace(/^https?:\/\//, "")}</Link>;
    case "color":
      return (
        <span className="flex items-center gap-2">
          <span
            className="size-4 shrink-0 rounded-full border"
            style={{ backgroundColor: text(value) }}
          />
          <span className="truncate font-mono text-xs">{text(value)}</span>
        </span>
      );
    default:
      return <span className="truncate">{text(value)}</span>;
  }
}
