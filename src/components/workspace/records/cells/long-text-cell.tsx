import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { text } from "./shared";
import type { CellProps, EditorProps } from "./types";

export function LongTextCell({ column, value }: CellProps) {
  if (column.format === "json")
    return <span className="truncate font-mono text-xs">{JSON.stringify(value)}</span>;
  return <span className="truncate">{text(value)}</span>;
}

export function TextareaEditor({ row, column, onRowChange, onClose }: EditorProps) {
  const json = column.format === "json";
  const current = row[column.key];
  const [draft, setDraft] = useState(() =>
    current === null || current === undefined
      ? ""
      : json
        ? JSON.stringify(current, null, 2)
        : String(current as string),
  );
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    let value: unknown = draft === "" ? null : draft;
    if (json && draft.trim() !== "") {
      try {
        value = JSON.parse(draft) as unknown;
      } catch {
        return setError("Enter valid JSON");
      }
    } else if (json) value = null;
    onRowChange({ ...row, [column.key]: value }, true);
  };

  return (
    <Popover
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose(false, true);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            aria-label={column.name}
            className="-mx-3 h-full w-[calc(100%+1.5rem)] justify-start rounded-none bg-background font-normal"
          />
        }
      >
        <span className="truncate">{draft.replaceAll(/\s+/g, " ")}</span>
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-96 max-w-[calc(100vw-2rem)]">
        <div className="flex flex-col gap-3">
          <Textarea
            autoFocus
            aria-label={column.name}
            className={json ? "font-mono text-xs" : undefined}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                save();
              }
              if (event.key !== "Escape") event.stopPropagation();
            }}
          />
          {error && <p className="text-destructive-foreground text-xs">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">Ctrl + Enter to save</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onClose(false, true)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
