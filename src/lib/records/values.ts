import { z } from "zod";

import { FILE_MAX_COUNT, fileValueSchema, isImageType } from "../files";
import type { ColumnFormat, SelectChoice } from "../tables/formats";

type ColumnLike = {
  format: string;
  options: Record<string, unknown>;
  isRequired: boolean;
  generatedExpression: string | null;
};

const NOT_EDITABLE: ColumnFormat[] = ["binary"];

export const isEditableColumn = (column: Pick<ColumnLike, "format" | "generatedExpression">) =>
  column.generatedExpression === null && !NOT_EDITABLE.includes(column.format as ColumnFormat);

const choicesOf = (options: Record<string, unknown>) =>
  ((options.choices as SelectChoice[] | undefined) ?? []).map((choice) => choice.value);

function baseSchema(column: ColumnLike): z.ZodType {
  const { format, options } = column;

  switch (format) {
    case "email":
      return z.email("Enter a valid email address");
    case "url":
      return z.url("Enter a valid URL");
    case "integer":
    case "duration":
      return z.number("Enter a number").int("Enter a whole number");
    case "rating": {
      const max = typeof options.max === "number" ? options.max : 5;
      return z.number("Enter a number").int().min(0).max(max, `Rating can be at most ${max}`);
    }
    case "decimal":
    case "percent":
    case "currency":
      return z.number("Enter a number").finite();
    case "checkbox":
      return z.boolean();
    case "single_select": {
      const values = choicesOf(options);
      return z.string().refine((value) => values.includes(value), "Pick one of the choices");
    }
    case "multi_select": {
      const values = choicesOf(options);
      return z
        .array(z.string())
        .refine((items) => items.every((item) => values.includes(item)), "Pick from the choices");
    }
    case "date":
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");
    case "time":
      return z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Enter a valid time");
    case "datetime":
      return z.number("Enter a valid date and time").int();
    case "datetime_tz":
      return z
        .string()
        .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time");
    case "relation":
      return z.number().int().positive();
    case "json":
      return z.unknown();
    case "file":
    case "image": {
      const max = options.multiple === true ? FILE_MAX_COUNT : 1;
      const item =
        format === "image"
          ? fileValueSchema.refine((file) => isImageType(file.type), "Only images are allowed")
          : fileValueSchema;
      return z
        .array(item)
        .max(max, max === 1 ? "Only one file is allowed" : `At most ${max} files`);
    }
    default:
      return z.string().max(10_000, "Too long");
  }
}

export function valueSchema(column: ColumnLike): z.ZodType {
  const schema = baseSchema(column);
  if (column.isRequired)
    return z.unknown().superRefine((value, ctx) => {
      if (value === null || value === undefined)
        return ctx.addIssue({ code: "custom", message: "This field is required" });
      const result = schema.safeParse(value);
      if (!result.success)
        for (const issue of result.error.issues)
          ctx.addIssue({ code: "custom", message: issue.message });
    });
  return schema.nullable();
}

export const recordPatchSchema = z.object({
  values: z.record(z.string(), z.unknown()),
});

export function toDbValue(format: string, value: unknown) {
  if (value === null || value === undefined) return null;
  if (format === "checkbox") return value ? 1 : 0;
  if (format === "multi_select" || format === "json" || format === "file" || format === "image")
    return JSON.stringify(value);
  return value as string | number;
}

export type WriteColumn = ColumnLike & {
  id: number;
  columnName: string;
  name: string;
  defaultValue: string | null;
};

export type ParsedValue<C extends WriteColumn = WriteColumn> = {
  column: C;
  value: string | number | null;
};

export type ParseResult<C extends WriteColumn> =
  | { ok: true; values: ParsedValue<C>[] }
  | { ok: false; message: string; field?: string };

export function parseRecordValues<C extends WriteColumn>(
  columns: C[],
  values: Record<string, unknown>,
): ParseResult<C> {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  const parsed: ParsedValue<C>[] = [];

  for (const [key, input] of Object.entries(values)) {
    const column = byName.get(key);
    if (!column || !isEditableColumn(column))
      return { ok: false, message: `"${key}" can't be edited.` };
    const result = valueSchema(column).safeParse(input);
    if (!result.success)
      return {
        ok: false,
        message: `${column.name}: ${result.error.issues[0]?.message ?? "Invalid value"}`,
        field: column.columnName,
      };
    parsed.push({ column, value: toDbValue(column.format, result.data) as string | number | null });
  }

  return { ok: true, values: parsed };
}

export function findMissingRequired<C extends WriteColumn>(columns: C[], parsed: ParsedValue<C>[]) {
  return columns.find(
    (column) =>
      column.isRequired &&
      isEditableColumn(column) &&
      column.defaultValue === null &&
      !parsed.some((item) => item.column.id === column.id && item.value !== null),
  );
}
