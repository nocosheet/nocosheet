import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import {
  findDeletedColumn,
  findLiveColumnNamed,
  findTable,
  restoreColumn,
} from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");
    const column = await findDeletedColumn(table.id, params.column);
    if (!column) throw httpError(404, "This column isn't in the trash.");

    if (await findLiveColumnNamed(table.id, column.name))
      throw httpError(
        409,
        `A column named "${column.name}" already exists. Rename it first, then restore this one.`,
      );

    try {
      await restoreColumn(c.get("workspaceId"), table, column);
    } catch (error) {
      conflictOrBadRequest(
        error,
        `"${column.name}" can't be restored: its values are no longer unique.`,
      );
    }
    return { id: column.id };
  }),
);
