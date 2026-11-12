import { CalendarClockIcon, CalendarIcon, HashIcon, UserIcon, type LucideIcon } from "lucide-react";

import { filterKind, isSortableFormat } from "@/lib/records/filters";
import { isGroupableColumn, isGroupableFormat, isGroupableSystemKey } from "@/lib/records/grouping";
import { isEditableColumn } from "@/lib/records/values";
import { FORMATS, SEARCHABLE_FORMATS, type ColumnFormat } from "@/lib/tables/formats";

export type SystemFormat = "id" | "created_at" | "updated_at" | "user";

export type ViewerColumn = {
  key: string;
  name: string;
  format: ColumnFormat | SystemFormat;
  options: Record<string, unknown>;
  icon: string | null;
  formatIcon: LucideIcon;
  width: number;
  sortable: boolean;
  filterable: boolean;
  groupable: boolean;
  groupFormat: boolean;
  searchable: boolean;
  title: boolean;
  hiddenByDefault: boolean;
  required: boolean;
  readOnly: boolean;
  description: string | null;
  defaultValue: string | null;
};

type TableDetail = {
  titleColumnId: number | null;
  columns: {
    id: number;
    columnName: string;
    name: string;
    icon: string | null;
    format: string;
    options: Record<string, unknown>;
    isSortable: boolean;
    isFilterable: boolean;
    isSearchable: boolean;
    isHidden: boolean;
    isRequired: boolean;
    checkExpression: string | null;
    generatedExpression: string | null;
    description: string | null;
    defaultValue: string | null;
  }[];
};

const WIDTHS: Partial<Record<ColumnFormat, number>> = {
  text: 220,
  long_text: 280,
  email: 230,
  url: 230,
  phone: 160,
  color: 140,
  integer: 120,
  decimal: 130,
  percent: 120,
  currency: 140,
  rating: 140,
  duration: 120,
  checkbox: 100,
  single_select: 160,
  multi_select: 220,
  date: 140,
  time: 110,
  datetime: 190,
  datetime_tz: 200,
  file: 160,
  image: 160,
  relation: 190,
  json: 200,
  binary: 120,
};

export function buildViewerColumns(table: TableDetail): ViewerColumn[] {
  const columns: ViewerColumn[] = table.columns.map((column) => {
    const format = column.format as ColumnFormat;
    const title = column.id === table.titleColumnId;
    return {
      key: column.columnName,
      name: column.name,
      format,
      options: column.options,
      icon: column.icon,
      formatIcon: FORMATS[format].icon,
      width: title ? Math.max(WIDTHS[format] ?? 200, 240) : (WIDTHS[format] ?? 180),
      sortable: column.isSortable && isSortableFormat(format),
      filterable: column.isFilterable && filterKind(format) !== null,
      groupable: isGroupableColumn(column),
      groupFormat: isGroupableFormat(format),
      searchable: column.isSearchable && SEARCHABLE_FORMATS.includes(format),
      title,
      hiddenByDefault: column.isHidden,
      required: column.isRequired,
      readOnly: !isEditableColumn(column),
      description: column.description,
      defaultValue: column.defaultValue,
    };
  });

  const system = (
    key: string,
    name: string,
    format: SystemFormat,
    formatIcon: LucideIcon,
    width: number,
    sortable: boolean,
  ): ViewerColumn => ({
    key,
    name,
    format,
    options: {},
    icon: null,
    formatIcon,
    width,
    sortable,
    filterable: false,
    groupable: isGroupableSystemKey(key),
    groupFormat: isGroupableSystemKey(key),
    searchable: false,
    title: false,
    hiddenByDefault: true,
    required: false,
    readOnly: true,
    description: null,
    defaultValue: null,
  });

  columns.sort((a, b) => Number(b.title) - Number(a.title));

  return [
    ...columns,
    system("id", "Id", "id", HashIcon, 120, true),
    system("created_at", "Created at", "created_at", CalendarClockIcon, 190, true),
    system("updated_at", "Updated at", "updated_at", CalendarIcon, 190, true),
    system("created_by", "Created by", "user", UserIcon, 160, false),
    system("updated_by", "Updated by", "user", UserIcon, 160, false),
  ];
}

export type ViewScope = { id: number; selectColumns: string[] };

export const buildViewColumns = (table: TableDetail, selectColumns: string[]) =>
  buildViewerColumns({
    ...table,
    columns: table.columns.filter((column) => selectColumns.includes(column.columnName)),
  });
