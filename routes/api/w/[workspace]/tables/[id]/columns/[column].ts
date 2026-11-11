import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { findDependentColumn } from "@/lib/tables/expression";
import { SEARCHABLE_FORMATS } from "@/lib/tables/formats";
import {
  dropColumn,
  findColumn,
  findTable,
  listColumns,
  updateColumn,
} from "@/lib/tables/repository";
import { columnPatchSchema } from "@/lib/tables/validation";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnPatchSchema })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");
    const column = await findColumn(table.id, params.column);
    if (!column) throw httpError(404, "Column not found.");

    if (body.isSearchable && !SEARCHABLE_FORMATS.includes(column.format as never))
      throw httpError(400, "Only text columns can be searchable.");

    try {
      return await updateColumn(c.get("workspaceId"), table, column, body);
    } catch (error) {
      conflictOrBadRequest(error, "A column with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");
    const column = await findColumn(table.id, params.column);
    if (!column) throw httpError(404, "Column not found.");

    const dependent = findDependentColumn(await listColumns(table.id), column);
    if (dependent)
      throw httpError(
        409,
        `"${dependent.name}" uses "${column.name}" in its formula or check, so it can't be deleted.`,
      );

    try {
      await dropColumn(c.get("workspaceId"), table, column);
    } catch (error) {
      throw httpError(
        409,
        error instanceof Error ? error.message : "The column could not be deleted.",
      );
    }
    return { ok: true };
  }),
);
