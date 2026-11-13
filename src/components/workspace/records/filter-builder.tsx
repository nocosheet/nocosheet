import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuCheckboxItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
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

export type FilterField = Pick<ViewerColumn, "key" | "name" | "format" | "filterable" | "options">;

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
  column: FilterField;
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

const blankCondition = (column: FilterField): FilterCondition => {
  const kind = filterKind(column.format) as FilterKind;
  const op = operatorsFor(kind)[0].value;
  return { column: column.key, op, ...(kind === "checkbox" ? { value: true } : {}) };
};

export const MAX_FILTERS = 10;

export function filterErrors(columns: FilterField[], value: FilterCondition[]) {
  const byKey = new Map(columns.filter((column) => column.filterable).map((c) => [c.key, c]));
  return value.map((condition) => {
    const column = byKey.get(condition.column);
    const kind = column ? filterKind(column.format) : null;
    return kind ? conditionError(kind, condition) : "Pick a column";
  });
}

export function FilterBuilder({
  columns,
  value,
  onChange,
  footer,
}: {
  columns: FilterField[];
  value: FilterCondition[];
  onChange: (value: FilterCondition[]) => void;
  footer?: React.ReactNode;
}) {
  const filterable = columns.filter((column) => column.filterable);
  const byKey = new Map(filterable.map((column) => [column.key, column]));

  const update = (index: number, next: FilterCondition) =>
    onChange(value.map((item, i) => (i === index ? next : item)));

  return (
    <div className="flex w-full flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((condition, index) => {
            const column = byKey.get(condition.column) ?? filterable[0];
            const kind = filterKind(column.format) as FilterKind;
            return (
              <div
                key={index}
                className="grid grid-cols-[2rem_7rem_7rem_10rem] items-center gap-2 max-sm:grid-cols-[2rem_1fr] max-sm:rounded-lg max-sm:border max-sm:p-2"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove filter"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                >
                  <XIcon />
                </Button>
                <SimpleSelect
                  label="Column"
                  value={column.key}
                  items={filterable.map((item) => ({ value: item.key, label: item.name }))}
                  onValueChange={(key) => update(index, blankCondition(byKey.get(key) ?? column))}
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
          disabled={value.length >= MAX_FILTERS || filterable.length === 0}
          onClick={() => onChange([...value, blankCondition(filterable[0])])}
        >
          <PlusIcon />
          Add filter
        </Button>
        {footer}
      </div>
    </div>
  );
}
