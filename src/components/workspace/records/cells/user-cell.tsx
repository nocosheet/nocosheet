import type { CellProps } from "./types";

export function UserCell({ value }: CellProps) {
  return (
    <span className="truncate">{(value as { label?: string | null }).label ?? "Unknown"}</span>
  );
}
