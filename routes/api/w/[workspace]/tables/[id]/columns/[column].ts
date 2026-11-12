import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { classifyDbError } from "@/lib/db-errors";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { SEARCHABLE_FORMATS } from "@/lib/tables/formats";
import { RESERVED_COLUMN_NAMES, toColumnName } from "@/lib/tables/naming";
import {
  dropColumn,
  findColumn,
  findTable,
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

    const columnName =
      body.name !== undefined && body.name !== column.name ? toColumnName(body.name) : undefined;
    let rename: { columnName: string } | undefined;
    if (columnName !== undefined && columnName !== column.columnName) {
      if (!columnName) throw httpError(400, "Name must contain letters or numbers.", "name");
      if (RESERVED_COLUMN_NAMES.includes(columnName))
        throw httpError(400, `"${columnName}" is reserved for the table.`, "name");
      rename = { columnName };
    }

    try {
      return await updateColumn(c.get("workspaceId"), table, column, body, rename);
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
