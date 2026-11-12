import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { classifyDbError } from "@/lib/db-errors";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { SEARCHABLE_FORMATS } from "@/lib/tables/formats";
import {
  dropColumn,
  findColumn,
  findTable,
  updateColumn,
} from "@/lib/tables/repository";
import { columnPatchSchema } from "@/lib/tables/validation";
import { findViewsUsingColumn } from "@/lib/views/repository";

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

    const views = await findViewsUsingColumn(table.id, column.columnName);
    if (views.length > 0)
      throw httpError(
        409,
        `"${column.name}" is used by ${views.map((view) => (view.deletedAt ? `the deleted view "${view.name}"` : `the view "${view.name}"`)).join(", ")}, so it can't be deleted.`,
      );

    try {
      await dropColumn(c.get("workspaceId"), table, column);
    } catch (error) {
      const failure = classifyDbError(error);
      throw httpError(
        409,
        failure.kind === "dependency"
          ? `"${column.name}" is used by another column's computed value or check, so it can't be deleted.`
          : failure.message,
      );
    }
    return { ok: true };
  }),
);
