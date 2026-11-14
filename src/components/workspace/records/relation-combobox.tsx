import { useMemo, useRef, useState } from "react";

import { SearchIcon } from "lucide-react";

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { SelectButton } from "@/components/ui/select";

import type { ViewerColumn } from "./columns";
import { useRelationItems, type RelationItem } from "./relation-items";

const NONE_ITEM: RelationItem = { value: "__none__", label: "None", id: 0 };

export function RelationCombobox({
  id,
  workspace,
  column,
  value,
  current,
  disabled,
  defaultOpen,
  cell,
  onChange,
  onClose,
}: {
  id?: string;
  workspace: string;
  column: ViewerColumn;
  value: string;
  current: unknown;
  disabled?: boolean;
  defaultOpen?: boolean;
  cell?: boolean;
  onChange: (item: RelationItem | null) => void;
  onClose?: () => void;
}) {
  const [search, setSearch] = useState("");
  const { items: results, isFetching } = useRelationItems(workspace, column, search);
  const items = column.required || search.trim() ? results : [NONE_ITEM, ...results];
  const picked = useRef<RelationItem | null>(null);

  const reference = current as { id: number; label: string | null } | null;
  const found: RelationItem | null =
    value === ""
      ? column.required
        ? null
        : NONE_ITEM
      : (items.find((item) => item.value === value) ??
        (picked.current?.value === value ? picked.current : null) ??
        (reference && String(reference.id) === value
          ? { value, label: reference.label ?? `#${reference.id}`, id: reference.id }
          : { value, label: `#${value}`, id: Number(value) }));
  const selected = useMemo(() => found, [found?.value, found?.label]);

  return (
    <Combobox
      items={items}
      value={selected}
      filter={null}
      defaultOpen={defaultOpen}
      disabled={disabled}
      isItemEqualToValue={(a, b) => a.value === b.value}
      onValueChange={(item) => {
        picked.current = item;
        onChange(item && item.value !== NONE_ITEM.value ? item : null);
      }}
      onInputValueChange={(next, details) => {
        if (details.reason === "input-change") setSearch(next);
      }}
      onOpenChange={(open) => {
        if (open) setSearch("");
        else onClose?.();
      }}
    >
      <ComboboxTrigger
        id={id}
        render={
          <SelectButton
            size={cell ? "sm" : undefined}
            className={
              cell
                ? "-mx-3 h-full w-[calc(100%+1.5rem)] rounded-none border-0 shadow-none before:hidden"
                : undefined
            }
          />
        }
      >
        <ComboboxValue placeholder="Pick a record" />
      </ComboboxTrigger>
      <ComboboxPopup aria-label={column.name}>
        <div className="border-b p-2">
          <ComboboxInput
            autoFocus
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder="Search records"
            showTrigger={false}
            startAddon={<SearchIcon />}
          />
        </div>
        <ComboboxStatus>{isFetching ? "Searching…" : null}</ComboboxStatus>
        <ComboboxEmpty>No records found</ComboboxEmpty>
        <ComboboxList>
          {(item: RelationItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
