import { FileIcon, ImageIcon } from "lucide-react";

import { Muted } from "./shared";
import type { CellProps } from "./types";

export function AttachmentCell({ column, value }: CellProps) {
  if (column.format === "binary") return <Muted>Binary</Muted>;
  const count = Array.isArray(value) ? value.length : 1;
  const Icon = column.format === "image" ? ImageIcon : FileIcon;
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-3.5" />
      {count} {count === 1 ? "file" : "files"}
    </span>
  );
}
