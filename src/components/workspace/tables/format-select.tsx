import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FORMATS, formatsByGroup, type ColumnFormat } from "@/lib/tables/formats";

export function FormatSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: ColumnFormat;
  onValueChange: (value: ColumnFormat) => void;
  disabled?: boolean;
}) {
  const items = Object.entries(FORMATS).map(([format, { label }]) => ({ value: format, label }));

  return (
    <Select
      value={value}
      onValueChange={(next) => onValueChange(next as ColumnFormat)}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger aria-label="Type">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {formatsByGroup.map(({ group, formats }) => (
          <SelectGroup key={group}>
            <SelectGroupLabel>{group}</SelectGroupLabel>
            {formats.map((format) => {
              const Icon = FORMATS[format].icon;
              return (
                <SelectItem key={format} value={format}>
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {FORMATS[format].label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectPopup>
    </Select>
  );
}
