import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CellProps } from "./types";

export function CheckboxCell({ value }: CellProps) {
  return (
    <span
      role="img"
      aria-label={value ? "Checked" : "Unchecked"}
      className={cn(
        "flex size-4 items-center justify-center rounded-[.25rem] border",
        value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background",
      )}
    >
      {value ? <CheckIcon className="size-3" /> : null}
    </span>
  );
}
