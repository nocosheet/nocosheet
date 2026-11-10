import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["Table", "Columns"] as const;

export function WizardSteps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-3 border-b px-5 py-4" aria-label="Progress">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < step;
        const current = number === step;
        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-3 last:flex-none"
            aria-current={current ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border font-medium text-xs",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-dashed border-foreground",
                !done && !current && "text-muted-foreground",
              )}
            >
              {done ? <CheckIcon className="size-3.5" /> : number}
            </span>
            <span
              className={cn("font-medium text-sm", !current && !done && "text-muted-foreground")}
            >
              {label}
            </span>
            {number < STEPS.length && (
              <span className={cn("h-px flex-1", done ? "bg-foreground" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
