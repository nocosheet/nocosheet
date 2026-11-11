import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Action, isScopedAction, type Scope } from "@/lib/roles/permissions";

export type ScopeValue = Scope | "inherit";

const SCOPED = [
  { value: "none", label: "None" },
  { value: "own", label: "Own records" },
  { value: "all", label: "All records" },
];

const FLAG = [
  { value: "none", label: "Not allowed" },
  { value: "all", label: "Allowed" },
];

export function ScopeSelect({
  action,
  value,
  onValueChange,
  inherit,
  disabled,
  label,
}: {
  action: Action;
  value: ScopeValue;
  onValueChange: (value: ScopeValue) => void;
  inherit?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const items = [
    ...(inherit ? [{ value: "inherit", label: "Same as workspace" }] : []),
    ...(isScopedAction(action) ? SCOPED : FLAG),
  ];

  return (
    <Select
      value={value}
      items={items}
      disabled={disabled}
      onValueChange={(next) => onValueChange(next as ScopeValue)}
    >
      <SelectTrigger aria-label={label} size="sm" className="w-full min-w-0">
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
