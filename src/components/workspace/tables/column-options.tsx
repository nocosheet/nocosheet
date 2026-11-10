import { useQuery } from "@tanstack/react-query";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tablesQueryOptions } from "@/data/workspace/tables";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  CURRENCIES,
  DURATION_DISPLAYS,
  RELATION_ON_DELETE,
  type ColumnFormat,
  type SelectChoice,
} from "@/lib/tables/formats";

import { ChoicesEditor } from "./choices-editor";
import { ToggleRow } from "./toggle-row";

type Options = Record<string, unknown>;

const text = (value: unknown, fallback = "") =>
  typeof value === "string" || typeof value === "number" ? String(value) : fallback;

function SimpleSelect({
  label,
  value,
  items,
  onValueChange,
}: {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <Field className="min-w-40 flex-1">
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value}
        items={items}
        onValueChange={(next) => next !== null && onValueChange(String(next))}
      >
        <SelectTrigger aria-label={label} className="w-full">
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
    </Field>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: unknown;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field className="min-w-40 flex-1">
      <FieldLabel>{label}</FieldLabel>
      <Input
        type="number"
        className="w-full"
        min={min}
        max={max}
        value={text(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}

function RelationOptions({
  options,
  onChange,
}: {
  options: Options;
  onChange: (o: Options) => void;
}) {
  const { data } = useQuery(
    tablesQueryOptions(useWorkspace().id, {
      page: 1,
      pageSize: 100,
      sort: "name",
      order: "asc",
      q: "",
    }),
  );
  const items = (data?.rows ?? []).map((table) => ({ value: String(table.id), label: table.name }));

  return (
    <>
      <SimpleSelect
        label="Linked table"
        value={text(options.tableId)}
        items={items}
        onValueChange={(value) => onChange({ ...options, tableId: Number(value) })}
      />
      <SimpleSelect
        label="When the linked record is deleted"
        value={text(options.onDelete, "set null")}
        items={[...RELATION_ON_DELETE]}
        onValueChange={(value) => onChange({ ...options, onDelete: value })}
      />
    </>
  );
}

export function ColumnOptions({
  format,
  options,
  onChange,
}: {
  format: ColumnFormat;
  options: Options;
  onChange: (options: Options) => void;
}) {
  const set = (patch: Options) => onChange({ ...options, ...patch });

  switch (format) {
    case "single_select":
    case "multi_select":
      return (
        <Field className="basis-full">
          <FieldLabel>Choices</FieldLabel>
          <ChoicesEditor
            choices={(options.choices as SelectChoice[] | undefined) ?? []}
            onChange={(choices) => set({ choices })}
          />
        </Field>
      );
    case "currency":
      return (
        <>
          <SimpleSelect
            label="Currency"
            value={text(options.currency, "USD")}
            items={CURRENCIES.map((code) => ({ value: code, label: code }))}
            onValueChange={(currency) => set({ currency })}
          />
          <NumberInput
            label="Decimal places"
            value={options.precision}
            min={0}
            max={8}
            onChange={(precision) => set({ precision })}
          />
        </>
      );
    case "decimal":
    case "percent":
      return (
        <NumberInput
          label="Decimal places"
          value={options.precision}
          min={0}
          max={8}
          onChange={(precision) => set({ precision })}
        />
      );
    case "rating":
      return (
        <NumberInput
          label="Maximum rating"
          value={options.max}
          min={1}
          max={10}
          onChange={(max) => set({ max })}
        />
      );
    case "duration":
      return (
        <SimpleSelect
          label="Display"
          value={text(options.display, "h:mm")}
          items={[...DURATION_DISPLAYS]}
          onValueChange={(display) => set({ display })}
        />
      );
    case "file":
    case "image":
      return (
        <div className="basis-full">
          <ToggleRow
            title="Allow multiple"
            description="Store several files in the same cell."
            checked={Boolean(options.multiple)}
            onCheckedChange={(multiple) => set({ multiple })}
          />
        </div>
      );
    case "relation":
      return <RelationOptions options={options} onChange={onChange} />;
    default:
      return null;
  }
}
