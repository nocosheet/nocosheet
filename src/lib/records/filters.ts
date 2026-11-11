import { z } from "zod";

import type { ColumnFormat } from "../tables/formats";

export type FilterKind = "text" | "number" | "checkbox" | "single_select" | "multi_select" | "date";

export type ValueInput = "none" | "text" | "number" | "date" | "boolean" | "choice" | "choices";

const KIND_BY_FORMAT: Partial<Record<ColumnFormat, FilterKind>> = {
  text: "text",
  long_text: "text",
  email: "text",
  url: "text",
  phone: "text",
  color: "text",
  integer: "number",
  decimal: "number",
  percent: "number",
  currency: "number",
  rating: "number",
  duration: "number",
  checkbox: "checkbox",
  single_select: "single_select",
  multi_select: "multi_select",
  date: "date",
  datetime: "date",
  datetime_tz: "date",
};

const NOT_SORTABLE: ColumnFormat[] = [
  "multi_select",
  "json",
  "binary",
  "file",
  "image",
  "relation",
];

export const filterKind = (format: string): FilterKind | null =>
  KIND_BY_FORMAT[format as ColumnFormat] ?? null;

export const isSortableFormat = (format: string) => !NOT_SORTABLE.includes(format as ColumnFormat);

const EMPTY = [
  { value: "is_empty", label: "is empty", input: "none" },
  { value: "is_not_empty", label: "is not empty", input: "none" },
] as const;

export const OPERATORS = {
  text: [
    { value: "contains", label: "contains", input: "text" },
    { value: "not_contains", label: "does not contain", input: "text" },
    { value: "equals", label: "is", input: "text" },
    { value: "not_equals", label: "is not", input: "text" },
    { value: "starts_with", label: "starts with", input: "text" },
    { value: "ends_with", label: "ends with", input: "text" },
    ...EMPTY,
  ],
  number: [
    { value: "eq", label: "is", input: "number" },
    { value: "neq", label: "is not", input: "number" },
    { value: "gt", label: "is greater than", input: "number" },
    { value: "gte", label: "is greater than or equal to", input: "number" },
    { value: "lt", label: "is less than", input: "number" },
    { value: "lte", label: "is less than or equal to", input: "number" },
    ...EMPTY,
  ],
  checkbox: [{ value: "is", label: "is", input: "boolean" }],
  single_select: [
    { value: "is", label: "is", input: "choice" },
    { value: "is_not", label: "is not", input: "choice" },
    { value: "is_any_of", label: "is any of", input: "choices" },
    ...EMPTY,
  ],
  multi_select: [{ value: "has_any_of", label: "has any of", input: "choices" }, ...EMPTY],
  date: [
    { value: "eq", label: "is", input: "date" },
    { value: "before", label: "is before", input: "date" },
    { value: "after", label: "is after", input: "date" },
    { value: "on_or_before", label: "is on or before", input: "date" },
    { value: "on_or_after", label: "is on or after", input: "date" },
    ...EMPTY,
  ],
} as const satisfies Record<
  FilterKind,
  readonly { value: string; label: string; input: ValueInput }[]
>;

export type FilterOp = (typeof OPERATORS)[FilterKind][number]["value"];

const ALL_OPS = [
  ...new Set(Object.values(OPERATORS).flatMap((list) => list.map((item) => item.value))),
] as [FilterOp, ...FilterOp[]];

export const operatorsFor = (
  kind: FilterKind,
): readonly { value: FilterOp; label: string; input: ValueInput }[] => OPERATORS[kind];

export const operatorInput = (kind: FilterKind, op: string): ValueInput =>
  operatorsFor(kind).find((item) => item.value === op)?.input ?? "none";

export const filterConditionSchema = z.object({
  column: z.string().min(1).max(64),
  op: z.enum(ALL_OPS),
  value: z
    .union([z.string().max(200), z.number(), z.boolean(), z.array(z.string().max(100)).max(50)])
    .optional(),
});

export const filtersSchema = z.array(filterConditionSchema).max(10);

export type FilterCondition = z.infer<typeof filterConditionSchema>;

export function conditionError(kind: FilterKind, condition: FilterCondition): string | null {
  const operator = operatorsFor(kind).find((item) => item.value === condition.op);
  if (!operator) return `"${condition.op}" can't be used on this column`;

  const { value } = condition;
  switch (operator.input) {
    case "none":
      return null;
    case "number":
      return typeof value === "number" && Number.isFinite(value) ? null : "Enter a number";
    case "boolean":
      return typeof value === "boolean" ? null : "Pick yes or no";
    case "choices":
      return Array.isArray(value) && value.length > 0 ? null : "Pick at least one option";
    case "date":
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? null : "Pick a date";
    default:
      return typeof value === "string" && value.length > 0 ? null : "Enter a value";
  }
}
