import { z } from "zod";

import { filtersSchema } from "../records/filters";
import { resolveRecordsQuery } from "../records/query";
import { checkRecordsQuery } from "../records/validation";
import { iconName } from "../tables/validation";

export const viewInputSchema = z.object({
  icon: iconName,
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value || null),
  selectColumns: z
    .array(z.string().min(1).max(64))
    .min(1, "Pick at least one column")
    .max(200)
    .transform((value) => [...new Set(value)]),
  filters: filtersSchema.default([]),
  join: z.enum(["and", "or"]).default("and"),
});

export const viewsDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export const viewPatchSchema = viewInputSchema.pick({ icon: true, name: true, description: true });

export type ViewInput = z.input<typeof viewInputSchema>;
export type ViewPatchInput = z.input<typeof viewPatchSchema>;
export type ViewPatchValues = z.output<typeof viewPatchSchema>;
export type ViewValues = z.output<typeof viewInputSchema>;

type DefinitionColumn = Parameters<typeof checkRecordsQuery>[0][number];

export function checkViewDefinition(columns: DefinitionColumn[], view: ViewValues) {
  const known = new Set(columns.map((column) => column.columnName));
  const missing = view.selectColumns.find((name) => !known.has(name));
  if (missing) return `"${missing}" isn't a column of this table.`;
  return checkRecordsQuery(
    columns,
    resolveRecordsQuery({ filters: view.filters, join: view.join }),
  );
}
