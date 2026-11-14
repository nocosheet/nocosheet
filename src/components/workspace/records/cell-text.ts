export function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(cellText).join(", ");
  if (typeof value === "object") {
    const label = (value as { label?: unknown }).label;
    return typeof label === "string" ? label : JSON.stringify(value);
  }
  return String(value);
}
