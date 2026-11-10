import { z } from "zod";

import { isSafeExpression } from "./expression";
import {
  COLUMN_FORMATS,
  CURRENCIES,
  DURATION_DISPLAYS,
  FORMATS,
  RELATION_ON_DELETE,
  SEARCHABLE_FORMATS,
  TITLE_FORMATS,
  type ColumnFormat,
} from "./formats";
import { ICON_NAME_PATTERN } from "./icons";
import { RESERVED_COLUMN_NAMES, toColumnName, toTableName } from "./naming";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullish()
    .transform((value) => value ?? null);

const iconName = z
  .string()
  .max(64)
  .regex(ICON_NAME_PATTERN, "Unknown icon")
  .nullish()
  .transform((value) => value ?? null);

export const ID_TYPES = ["increment", "uuid"] as const;

export const tableInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(64, "Name must be 64 characters or fewer")
    .refine((value) => toTableName(value).length > 0, "Name must contain letters or numbers"),
  icon: iconName,
  groupName: optionalText(64),
  description: optionalText(500),
  idType: z.enum(ID_TYPES),
  hasCreatedAt: z.boolean(),
  hasCreatedBy: z.boolean(),
  hasUpdatedAt: z.boolean(),
  hasUpdatedBy: z.boolean(),
});

export type TableInput = z.input<typeof tableInputSchema>;
export type TableValues = z.output<typeof tableInputSchema>;

const choiceSchema = z.object({
  label: z.string().trim().min(1, "Choice label is required").max(64),
  value: z.string().trim().min(1).max(64),
});

const optionsSchema = z.record(z.string(), z.unknown());

const columnFields = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  description: optionalText(500),
  icon: iconName,
  format: z.enum(COLUMN_FORMATS),
  options: optionsSchema.default({}),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(true),
  isSortable: z.boolean().default(true),
  isSearchable: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  defaultValue: optionalText(500),
  checkExpression: optionalText(500),
  generatedExpression: optionalText(500),
});

type ColumnFields = z.output<typeof columnFields>;

function refineColumn(column: ColumnFields, ctx: z.core.$RefinementCtx) {
  const issue = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  const columnName = toColumnName(column.name);
  if (!columnName) issue("name", "Name must contain letters or numbers");
  else if (RESERVED_COLUMN_NAMES.includes(columnName))
    issue("name", `"${columnName}" is reserved for the table`);

  if (column.isSearchable && !SEARCHABLE_FORMATS.includes(column.format))
    issue("isSearchable", "Only text columns can be searchable");

  if (column.checkExpression && !isSafeExpression(column.checkExpression))
    issue("checkExpression", "Enter a valid SQL expression");

  if (column.generatedExpression) {
    if (!isSafeExpression(column.generatedExpression))
      issue("generatedExpression", "Enter a valid SQL expression");
    if (column.defaultValue) issue("defaultValue", "Computed columns cannot have a default");
  }

  validateOptions(column.format, column.options, issue);
}

export const columnDraftSchema = columnFields.superRefine(refineColumn);

export const columnInputSchema = columnFields
  .extend({ position: z.number().int().nonnegative() })
  .superRefine(refineColumn);

export type ColumnInput = z.input<typeof columnInputSchema>;
export type ColumnValues = z.output<typeof columnInputSchema>;

function validateOptions(
  format: ColumnFormat,
  options: Record<string, unknown>,
  issue: (path: string, message: string) => void,
) {
  if (format === "single_select" || format === "multi_select") {
    const parsed = z
      .array(choiceSchema)
      .min(1, "Add at least one choice")
      .safeParse(options.choices);
    if (!parsed.success)
      return issue("options", parsed.error.issues[0]?.message ?? "Invalid choices");
    const values = parsed.data.map((choice) => choice.value);
    if (new Set(values).size !== values.length) issue("options", "Choices must be unique");
  }

  if (format === "currency" && !CURRENCIES.includes(String(options.currency)))
    issue("options", "Pick a currency");

  if (format === "rating") {
    const max = Number(options.max);
    if (!Number.isInteger(max) || max < 1 || max > 10)
      issue("options", "Rating max must be 1 to 10");
  }

  if (format === "duration" && !DURATION_DISPLAYS.some((item) => item.value === options.display))
    issue("options", "Pick a duration format");

  if (format === "relation") {
    if (!Number.isInteger(options.tableId) || Number(options.tableId) < 1)
      issue("options", "Pick a table to link to");
    if (!RELATION_ON_DELETE.some((item) => item.value === options.onDelete))
      issue("options", "Pick what happens on delete");
  }
}

export const columnsInputSchema = z
  .object({
    columns: z.array(columnInputSchema).min(1).max(100),
    titleColumn: z.string().nullish(),
  })
  .superRefine(({ columns, titleColumn }, ctx) => {
    const seen = new Set<string>();
    columns.forEach((column, index) => {
      const key = toColumnName(column.name);
      if (seen.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["columns", index, "name"],
          message: "Column names must be unique",
        });
      seen.add(key);
    });

    if (!titleColumn) return;
    const match = columns.find((column) => toColumnName(column.name) === titleColumn);
    if (!match || !TITLE_FORMATS.includes(match.format))
      ctx.addIssue({
        code: "custom",
        path: ["titleColumn"],
        message: "Pick a column that can be used as the title",
      });
  });

export const defaultOptions = (format: ColumnFormat): Record<string, unknown> => {
  switch (format) {
    case "single_select":
    case "multi_select":
      return { choices: [] };
    case "currency":
      return { currency: "USD", precision: 2 };
    case "decimal":
    case "percent":
      return { precision: 2 };
    case "rating":
      return { max: 5 };
    case "duration":
      return { display: "h:mm" };
    case "file":
    case "image":
      return { multiple: false };
    case "relation":
      return { onDelete: "set null" };
    default:
      return {};
  }
};

export const formatLabel = (format: ColumnFormat) => FORMATS[format].label;
