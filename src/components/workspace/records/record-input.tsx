import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FormValue } from "@/lib/records/form";
import type { SelectChoice } from "@/lib/tables/formats";

import type { ViewerColumn } from "./columns";
import { FileInput } from "./file-input";
import { RelationCombobox } from "./relation-combobox";

type InputProps = {
  id: string;
  workspace: string;
  tableId: number;
  column: ViewerColumn;
  value: FormValue;
  current: unknown;
  disabled: boolean;
  onChange: (value: FormValue) => void;
  onBlur: () => void;
};

const NONE = "__none__";

function OptionSelect({
  id,
  items,
  value,
  required,
  disabled,
  placeholder,
  onChange,
}: {
  id: string;
  items: { value: string; label: string }[];
  value: string;
  required: boolean;
  disabled: boolean;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const options = required ? items : [{ value: NONE, label: "None" }, ...items];
  return (
    <Select
      items={options}
      value={value === "" ? (required ? null : NONE) : value}
      disabled={disabled}
      onValueChange={(next) => onChange(next === null || next === NONE ? "" : String(next))}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
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

function RelationInput({ id, workspace, column, value, current, disabled, onChange }: InputProps) {
  return (
    <RelationCombobox
      id={id}
      workspace={workspace}
      column={column}
      value={String(value)}
      current={current}
      disabled={disabled}
      onChange={(item) => onChange(item ? item.value : "")}
    />
  );
}

export function RecordInput(props: InputProps) {
  const { id, column, value, disabled, onChange, onBlur } = props;
  const choices = (column.options.choices as SelectChoice[] | undefined) ?? [];
  const string = typeof value === "string" ? value : "";

  const input = (type: string, extra?: React.ComponentProps<typeof Input>) => (
    <Input
      id={id}
      type={type}
      autoComplete="off"
      disabled={disabled}
      value={string}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      {...extra}
    />
  );

  switch (column.format) {
    case "long_text":
      return (
        <Textarea
          id={id}
          disabled={disabled}
          value={string}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "json":
      return (
        <Textarea
          id={id}
          className="font-mono text-xs"
          disabled={disabled}
          value={string}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "integer":
    case "duration":
    case "rating":
      return input("number", { step: 1 });
    case "decimal":
    case "percent":
    case "currency":
      return input("number", { step: "any" });
    case "date":
      return input("date");
    case "time":
      return input("time");
    case "datetime":
    case "datetime_tz":
      return input("datetime-local");
    case "checkbox":
      return (
        <Switch
          id={id}
          disabled={disabled}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "single_select":
      return (
        <OptionSelect
          id={id}
          items={choices.map((choice) => ({ value: choice.value, label: choice.label }))}
          value={string}
          required={column.required}
          disabled={disabled}
          placeholder="Pick an option"
          onChange={onChange}
        />
      );
    case "multi_select": {
      const items = choices.map((choice) => ({ value: choice.value, label: choice.label }));
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <Combobox
          multiple
          items={items}
          disabled={disabled}
          value={items.filter((item) => selected.includes(item.value))}
          onValueChange={(next) => onChange(next.map((item) => item.value))}
        >
          <ComboboxChips>
            <ComboboxValue>
              {(picked: { value: string; label: string }[]) => (
                <>
                  {picked.map((item) => (
                    <ComboboxChip aria-label={item.label} key={item.value}>
                      {item.label}
                    </ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    id={id}
                    aria-label={column.name}
                    placeholder={picked.length > 0 ? undefined : "Pick options"}
                  />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxPopup>
            <ComboboxEmpty>No options found.</ComboboxEmpty>
            <ComboboxList>
              {(item: { value: string; label: string }) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      );
    }
    case "relation":
      return <RelationInput {...props} />;
    case "file":
    case "image":
      return <FileInput {...props} />;
    default:
      return input("text");
  }
}
