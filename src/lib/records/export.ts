import { choiceLabel } from "@/lib/tables/formats";

type ExportColumn = {
  key: string;
  name: string;
  format: string;
  options: Record<string, unknown>;
};

const BOM = "﻿";

const scalar = (value: unknown) =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : "";

function cellText(column: ExportColumn, value: unknown): string {
  if (value === null || value === undefined) return "";

  switch (column.format) {
    case "single_select":
      return choiceLabel(column.options, scalar(value));
    case "multi_select":
      return (Array.isArray(value) ? value : [])
        .map((item) => choiceLabel(column.options, scalar(item)))
        .join("; ");
    case "relation":
    case "user": {
      const reference = value as { id?: unknown; label?: string | null };
      return reference.label ?? scalar(reference.id);
    }
    case "created_at":
    case "updated_at":
    case "datetime": {
      const date = new Date(value as number | string);
      return Number.isNaN(date.getTime()) ? scalar(value) : date.toISOString();
    }
    case "json":
    case "file":
    case "image":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      return scalar(value);
  }
}

const escapeCell = (text: string) => {
  const safe = /^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text)) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

export function recordsToCsv(columns: ExportColumn[], rows: Record<string, unknown>[]) {
  const lines = [
    columns.map((column) => escapeCell(column.name)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCell(cellText(column, row[column.key]))).join(","),
    ),
  ];
  return BOM + lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
