import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, MenuCheckboxItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { choiceIndex, choiceLabel, type SelectChoice } from "@/lib/tables/formats";

import { text } from "./shared";
import type { CellProps, EditorProps } from "./types";

const CHOICE_VARIANTS = ["secondary", "info", "success", "warning", "outline"] as const;
const NONE = "__none__";

const choiceVariant = (options: Record<string, unknown>, value: string) =>
  CHOICE_VARIANTS[choiceIndex(options, value) % CHOICE_VARIANTS.length];

export function SelectCell({ column, value }: CellProps) {
  if (column.format === "multi_select")
    return (
      <span className="flex items-center gap-1 overflow-hidden">
        {(Array.isArray(value) ? value : []).map((item) => (
          <Badge key={text(item)} variant={choiceVariant(column.options, text(item))}>
            {choiceLabel(column.options, text(item))}
          </Badge>
        ))}
      </span>
    );

  return (
    <Badge variant={choiceVariant(column.options, text(value))}>
      {choiceLabel(column.options, text(value))}
    </Badge>
  );
}

const triggerClass =
  "-mx-3 h-full w-[calc(100%+1.5rem)] rounded-none border-0 shadow-none before:hidden";

export function SingleSelectEditor({ row, column, onRowChange, onClose }: EditorProps) {
  const choices = (column.options.choices as SelectChoice[] | undefined) ?? [];
  const current = row[column.key];
  const items = choices.map((choice) => ({ value: choice.value, label: choice.label }));
  const options = column.required ? items : [{ value: NONE, label: "None" }, ...items];
  const value = typeof current === "string" ? current : null;

  return (
    <Select
      defaultOpen
      items={options}
      value={value ?? (column.required ? null : NONE)}
      onValueChange={(next) =>
        onRowChange({ ...row, [column.key]: next === null || next === NONE ? null : next }, true)
      }
      onOpenChange={(open) => {
        if (!open) onClose(false, true);
      }}
    >
      <SelectTrigger aria-label={column.name} size="sm" className={triggerClass}>
        <SelectValue placeholder="Pick an option" />
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false}>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}

export function MultiSelectEditor({ row, column, onRowChange, onClose }: EditorProps) {
  const choices = (column.options.choices as SelectChoice[] | undefined) ?? [];
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(row[column.key]) ? (row[column.key] as string[]) : [],
  );
  const labels = choices.filter((choice) => selected.includes(choice.value)).map((c) => c.label);

  return (
    <Menu
      defaultOpen
      onOpenChange={(open, details) => {
        if (open) return;
        if (details.reason === "escape-key") onClose(false, true);
        else onRowChange({ ...row, [column.key]: selected }, true);
      }}
    >
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={column.name}
            className="-mx-3 h-full w-[calc(100%+1.5rem)] justify-start rounded-none bg-background font-normal"
          />
        }
      >
        <span className="truncate">{labels.length ? labels.join(", ") : "Pick options"}</span>
      </MenuTrigger>
      <MenuPopup align="start" className="max-h-64 min-w-44 overflow-y-auto">
        {choices.map((choice) => (
          <MenuCheckboxItem
            key={choice.value}
            checked={selected.includes(choice.value)}
            closeOnClick={false}
            onCheckedChange={(checked) =>
              setSelected((current) =>
                checked
                  ? [...current, choice.value]
                  : current.filter((item) => item !== choice.value),
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
