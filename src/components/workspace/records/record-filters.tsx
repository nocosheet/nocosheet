import { useState } from "react";

import { FilterIcon, PlusIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuCheckboxItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  conditionError,
  type FilterCondition,
  type FilterKind,
  filterKind,
  operatorInput,
  operatorsFor,
} from "@/lib/records/filters";
import type { SelectChoice } from "@/lib/tables/formats";
import { cn } from "@/lib/utils";

import type { ViewerColumn } from "./columns";

const BOOLEANS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function SimpleSelect({
  label,
  value,
  items,
  onValueChange,
  className,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      items={items}
      onValueChange={(next) => next !== null && onValueChange(String(next))}
    >
      <SelectTrigger aria-label={label} size="sm" className={cn("w-full min-w-0", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

function ChoicesPicker({
  choices,
  value,
  onChange,
}: {
  choices: SelectChoice[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const labels = choices
    .filter((choice) => value.includes(choice.value))
    .map((choice) => choice.label);
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="outline" size="sm" className="w-full justify-start font-normal" />}
      >
        <span className="truncate">{labels.length ? labels.join(", ") : "Pick options"}</span>
      </MenuTrigger>
      <MenuPopup align="start" className="max-h-64 min-w-44 overflow-y-auto">
        {choices.map((choice) => (
          <MenuCheckboxItem
            key={choice.value}
            checked={value.includes(choice.value)}
            closeOnClick={false}
            onCheckedChange={(checked) =>
              onChange(
                checked ? [...value, choice.value] : value.filter((item) => item !== choice.value),
              )
            }
          >
            {choice.label}
          </MenuCheckboxItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}

function ValueInput({
  column,
  kind,
  condition,
  onChange,
}: {
  column: ViewerColumn;
  kind: FilterKind;
  condition: FilterCondition;
  onChange: (value: FilterCondition["value"]) => void;
}) {
  const input = operatorInput(kind, condition.op);
  const choices = (column.options.choices as SelectChoice[] | undefined) ?? [];

  switch (input) {
    case "none":
      return null;
    case "boolean":
      return (
        <SimpleSelect
          label="Value"
          value={String(condition.value ?? true)}
          items={BOOLEANS}
          onValueChange={(next) => onChange(next === "true")}
        />
      );
    case "choice":
      return (
        <SimpleSelect
          label="Value"
          value={typeof condition.value === "string" ? condition.value : ""}
          items={choices.map((choice) => ({ value: choice.value, label: choice.label }))}
          onValueChange={onChange}
        />
      );
    case "choices":
      return (
        <ChoicesPicker
          choices={choices}
          value={Array.isArray(condition.value) ? condition.value : []}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          size="sm"
          aria-label="Value"
          value={typeof condition.value === "number" ? String(condition.value) : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? undefined : Number(event.target.value))
          }
        />
      );
    case "date":
      return (
        <Input
          type="date"
          size="sm"
          aria-label="Value"
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      );
    default:
      return (
        <Input
          size="sm"
          aria-label="Value"
          autoComplete="off"
          value={typeof condition.value === "string" ? condition.value : ""}
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      );
  }
}

const blankCondition = (column: ViewerColumn): FilterCondition => {
  const kind = filterKind(column.format) as FilterKind;
  const op = operatorsFor(kind)[0].value;
  return { column: column.key, op, ...(kind === "checkbox" ? { value: true } : {}) };
};

const JOINS = [
  { value: "and", label: "And" },
  { value: "or", label: "Or" },
];

export function RecordFilters({
  columns,
  value,
  join,
  onApply,
}: {
  columns: ViewerColumn[];
  value: FilterCondition[];
  join: "and" | "or";
  onApply: (filters: FilterCondition[], join: "and" | "or") => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterCondition[]>(value);
  const [draftJoin, setDraftJoin] = useState(join);

  const filterable = columns.filter((column) => column.filterable);
  const byKey = new Map(filterable.map((column) => [column.key, column]));
  const errors = draft.map((condition) => {
    const column = byKey.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    return kind ? conditionError(kind, condition) : "Pick a column";
  });
  const invalid = errors.some(Boolean);
  if (filterable.length === 0) return null;

  const update = (index: number, next: FilterCondition) =>
    setDraft((current) => current.map((item, i) => (i === index ? next : item)));

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
          {draft.length > 0 && (
            <div className="flex flex-col gap-2">
              {draft.map((condition, index) => {
                const column = byKey.get(condition.column) ?? filterable[0];
                const kind = filterKind(column.format) as FilterKind;
                return (
                  <div
                    key={index}
                    className="grid grid-cols-[2rem_4.5rem_8rem_8rem_1fr] items-center gap-2 max-sm:grid-cols-[2rem_1fr] max-sm:rounded-lg max-sm:border max-sm:p-2"
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove filter"
                      onClick={() => setDraft((current) => current.filter((_, i) => i !== index))}
                    >
                      <XIcon />
                    </Button>
                    {index === 0 ? (
                      <span className="px-2 text-muted-foreground text-sm">Where</span>
                    ) : index === 1 ? (
                      <SimpleSelect
                        label="Join"
                        value={draftJoin}
                        items={JOINS}
                        className="max-sm:w-24"
                        onValueChange={(next) => setDraftJoin(next as "and" | "or")}
                      />
                    ) : (
                      <span className="px-2 text-muted-foreground text-sm">
                        {draftJoin === "or" ? "Or" : "And"}
                      </span>
                    )}
                    <SimpleSelect
                      label="Column"
                      className="max-sm:col-span-full"
                      value={column.key}
                      items={filterable.map((item) => ({ value: item.key, label: item.name }))}
                      onValueChange={(key) =>
                        update(index, blankCondition(byKey.get(key) ?? column))
                      }
                    />
                    <SimpleSelect
                      label="Operator"
                      className="max-sm:col-span-full"
                      value={condition.op}
                      items={operatorsFor(kind).map((item) => ({
                        value: item.value,
                        label: item.label,
                      }))}
                      onValueChange={(op) =>
                        update(index, {
                          column: column.key,
                          op: op as FilterCondition["op"],
                          ...(operatorInput(kind, op) === "boolean" ? { value: true } : {}),
                        })
                      }
                    />
                    <div className="min-w-0 max-sm:col-span-full max-sm:empty:hidden">
                      <ValueInput
                        column={column}
                        kind={kind}
                        condition={condition}
                        onChange={(next) => update(index, { ...condition, value: next })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={draft.length >= 10}
              onClick={() => setDraft((current) => [...current, blankCondition(filterable[0])])}
            >
              <PlusIcon />
              Add filter
            </Button>
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
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
