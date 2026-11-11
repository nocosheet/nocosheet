import { useState } from "react";

import { Input } from "@/components/ui/input";

import type { ViewerColumn } from "../columns";
import type { EditorProps } from "./types";

const TEXT_FORMATS = ["text", "email", "url", "phone", "color"];
const NUMBER_FORMATS = ["integer", "decimal", "percent", "currency", "rating", "duration"];

export const INPUT_FORMATS = [
  ...TEXT_FORMATS,
  ...NUMBER_FORMATS,
  "date",
  "time",
  "datetime",
  "datetime_tz",
];

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalInput = (value: number | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function initialText(column: ViewerColumn, value: unknown) {
  if (value === null || value === undefined) return "";
  if (column.format === "datetime" || column.format === "datetime_tz")
    return toLocalInput(value as number | string);
  return String(value as string | number);
}

function parseText(column: ViewerColumn, text: string): unknown {
  if (text === "") return null;
  if (NUMBER_FORMATS.includes(column.format)) return Number(text);
  if (column.format === "datetime") return new Date(text).getTime();
  if (column.format === "datetime_tz") return new Date(text).toISOString();
  return text;
}

const inputType = (format: string) =>
  NUMBER_FORMATS.includes(format)
    ? "number"
    : format === "date"
      ? "date"
      : format === "time"
        ? "time"
        : format === "datetime" || format === "datetime_tz"
          ? "datetime-local"
          : "text";

export function InputEditor({ row, column, onRowChange, onClose }: EditorProps) {
  const [text, setText] = useState(() => initialText(column, row[column.key]));

  return (
    <Input
      unstyled
      nativeInput
      autoFocus
      autoComplete="off"
      size="sm"
      aria-label={column.name}
      className="-mx-3 flex h-full w-[calc(100%+1.5rem)] items-center bg-background"
      type={inputType(column.format)}
      step={column.format === "integer" || column.format === "duration" ? 1 : "any"}
      value={text}
      onFocus={(event) => event.target.select()}
      onChange={(event) => {
        setText(event.target.value);
        onRowChange({ ...row, [column.key]: parseText(column, event.target.value) });
      }}
      onBlur={() => onClose(true, false)}
    />
  );
}
