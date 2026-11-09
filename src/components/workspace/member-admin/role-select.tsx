import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MemberRole = "admin" | "user";

const roles: { value: MemberRole; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

type RoleSelectProps = {
  value: MemberRole;
  onValueChange: (value: MemberRole) => void;
  disabled?: boolean;
};

export function RoleSelect({ value, onValueChange, disabled }: RoleSelectProps) {
  return (
    <Select
      value={value}
      items={roles}
      disabled={disabled}
      onValueChange={(next) => onValueChange(next as MemberRole)}
    >
      <SelectTrigger aria-label="Role">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  );
}
