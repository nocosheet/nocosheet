import { FileIcon, ImageIcon } from "lucide-react";

import { asFiles, isImageType } from "@/lib/files";

import { Muted } from "./shared";
import type { CellProps } from "./types";

export function AttachmentCell({ column, value }: CellProps) {
  if (column.format === "binary") return <Muted>Binary</Muted>;
  const files = asFiles(value);
  if (files.length === 0) return null;
  const Icon = column.format === "image" ? ImageIcon : FileIcon;
  const images = files.filter((file) => isImageType(file.type));

  if (images.length === files.length)
    return (
      <span className="flex items-center gap-1">
        {images.slice(0, 3).map((file, index) => (
          <img
            key={`${file.url}-${index}`}
            src={file.url}
            alt={file.name}
            loading="lazy"
            className="size-6 rounded-sm border object-cover"
          />
        ))}
        {images.length > 3 && (
          <span className="text-muted-foreground text-xs">+{images.length - 3}</span>
        )}
      </span>
    );

  return (
    <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">
        {files.length === 1 ? files[0].name : `${files.length} files`}
      </span>
    </span>
  );
}
