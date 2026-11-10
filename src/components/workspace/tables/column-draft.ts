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
