import { useState } from "react";

import { FilterIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import type { FilterCondition } from "@/lib/records/filters";

import type { ViewerColumn } from "./columns";
import { FilterBuilder, filterErrors, type FilterJoin } from "./filter-builder";

export function RecordFilters({
  columns,
  value,
  join,
  onApply,
}: {
  columns: ViewerColumn[];
  value: FilterCondition[];
  join: FilterJoin;
  onApply: (filters: FilterCondition[], join: FilterJoin) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterCondition[]>(value);
  const [draftJoin, setDraftJoin] = useState(join);

  const invalid = filterErrors(columns, draft).some(Boolean);
  if (!columns.some((column) => column.filterable)) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(value);
          setDraftJoin(join);
        }
      }}
    >
      <PopoverTrigger render={<Button variant="outline" />}>
        <FilterIcon />
        Filter
        {value.length > 0 && <Badge variant="secondary">{value.length}</Badge>}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-[36rem] max-w-[calc(100vw-2rem)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h4 className="font-medium text-sm leading-none">
              {draft.length > 0 ? "Filters" : "No filters applied"}
            </h4>
            <p className="text-muted-foreground text-sm">
              {draft.length > 0
                ? "Only records matching these conditions are shown."
                : "Add filters to narrow down the records."}
            </p>
          </div>
          <FilterBuilder
            columns={columns}
            value={draft}
            join={draftJoin}
            onChange={(next, nextJoin) => {
              setDraft(next);
              setDraftJoin(nextJoin);
            }}
            footer={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={draft.length === 0 && value.length === 0}
                  onClick={() => {
                    setDraft([]);
                    setDraftJoin("and");
                    onApply([], "and");
                    setOpen(false);
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  disabled={invalid}
                  onClick={() => {
                    onApply(draft, draftJoin);
                    setOpen(false);
                  }}
                >
                  Apply filters
                </Button>
              </div>
            }
          />
        </div>
      </PopoverPopup>
    </Popover>
  );
}
