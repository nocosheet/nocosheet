type FormColumn = {
  key: string;
  format: string;
  readOnly: boolean;
  required: boolean;
  defaultValue: string | null;
};

export type FormValue = string | boolean | string[];
export type FormValues = Record<string, FormValue>;

const NUMBER_FORMATS = ["integer", "decimal", "percent", "currency", "rating", "duration"];

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

function toFormValue(column: FormColumn, value: unknown): FormValue {
  if (value === null || value === undefined)
    return column.format === "checkbox" ? false : column.format === "multi_select" ? [] : "";

  switch (column.format) {
    case "checkbox":
      return Boolean(value);
    case "multi_select":
      return Array.isArray(value) ? value.map(String) : [];
    case "datetime":
    case "datetime_tz": {
      const date = new Date(value as number | string);
      return Number.isNaN(date.getTime()) ? "" : toLocalInput(date);
    }
    case "json":
      return JSON.stringify(value, null, 2);
    case "relation":
      return String((value as { id: string | number }).id);
    default:
      return String(value as string | number);
  }
}

export const editableColumns = (columns: FormColumn[]) =>
  columns.filter((column) => !column.readOnly);

export const toDefaultFormValues = (columns: FormColumn[]) =>
  Object.fromEntries(
    editableColumns(columns).map((column) => [
      column.key,
      column.format === "checkbox"
        ? column.defaultValue === "true"
        : column.format === "multi_select"
          ? []
          : (column.defaultValue ?? ""),
    ]),
  ) as FormValues;

export const toFormValues = (columns: FormColumn[], record: Record<string, unknown>) =>
  Object.fromEntries(
    editableColumns(columns).map((column) => [column.key, toFormValue(column, record[column.key])]),
  ) as FormValues;

function toPayloadValue(column: FormColumn, value: FormValue): unknown {
  if (column.format === "checkbox") return value;
  if (column.format === "multi_select") return value;
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return null;

  if (NUMBER_FORMATS.includes(column.format)) {
    const number = Number(text);
    if (Number.isNaN(number)) throw new Error("Enter a number");
    return number;
  }
  if (column.format === "datetime") return new Date(text).getTime();
  if (column.format === "datetime_tz") return new Date(text).toISOString();
  if (column.format === "json") {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error("Enter valid JSON");
    }
  }
  return typeof value === "string" ? value : text;
}

export function buildPatch(columns: FormColumn[], values: FormValues, initial: FormValues) {
  const patch: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const column of editableColumns(columns)) {
    if (JSON.stringify(values[column.key]) === JSON.stringify(initial[column.key])) continue;
    try {
      const payload = toPayloadValue(column, values[column.key]);
      if (payload === null && column.required) errors[column.key] = "This field is required";
      else patch[column.key] = payload;
    } catch (error) {
      errors[column.key] = error instanceof Error ? error.message : "Invalid value";
    }
  }

  return { patch, errors };
}

export function buildCreate(columns: FormColumn[], values: FormValues) {
  const payload: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const column of editableColumns(columns)) {
    try {
      const value = toPayloadValue(column, values[column.key]);
      if (value === null) {
        if (column.required && column.defaultValue === null)
          errors[column.key] = "This field is required";
      } else payload[column.key] = value;
    } catch (error) {
      errors[column.key] = error instanceof Error ? error.message : "Invalid value";
    }
  }

  return { payload, errors };
}
