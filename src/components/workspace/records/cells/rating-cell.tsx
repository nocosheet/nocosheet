import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { text } from "./shared";
import type { CellProps } from "./types";

export function RatingCell({ column, value }: CellProps) {
  const max = typeof column.options.max === "number" ? column.options.max : 5;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${text(value)} of ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <StarIcon
          key={index}
          className={cn(
            "size-3.5",
            index < Number(value) ? "fill-warning text-warning" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
