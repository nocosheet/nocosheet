import type { ColumnFormat } from "@/lib/tables/formats";

export type ColumnDraft = {
  name: string;
  description: string;
  icon: string | null;
  format: ColumnFormat;
  options: Record<string, unknown>;
  isRequired: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  isSearchable: boolean;
  isUnique: boolean;
  isHidden: boolean;
  defaultValue: string;
  checkExpression: string;
  generatedExpression: string;
};

export const newColumnDraft = (): ColumnDraft => ({
  name: "",
  description: "",
  icon: null,
  format: "text",
  options: {},
  isRequired: false,
  isFilterable: true,
  isSortable: true,
  isSearchable: false,
  isUnique: false,
  isHidden: false,
  defaultValue: "",
  checkExpression: "",
  generatedExpression: "",
});

export const columnToDraft = (column: {
  name: string;
  description: string | null;
  icon: string | null;
  format: string;
  options: Record<string, unknown>;
  isRequired: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  isSearchable: boolean;
  isUnique: boolean;
  isHidden: boolean;
  defaultValue: string | null;
  checkExpression: string | null;
  generatedExpression: string | null;
}): ColumnDraft => ({
  name: column.name,
  description: column.description ?? "",
  icon: column.icon,
  format: column.format as ColumnFormat,
  options: column.options,
  isRequired: column.isRequired,
  isFilterable: column.isFilterable,
  isSortable: column.isSortable,
  isSearchable: column.isSearchable,
  isUnique: column.isUnique,
  isHidden: column.isHidden,
  defaultValue: column.defaultValue ?? "",
  checkExpression: column.checkExpression ?? "",
  generatedExpression: column.generatedExpression ?? "",
});
