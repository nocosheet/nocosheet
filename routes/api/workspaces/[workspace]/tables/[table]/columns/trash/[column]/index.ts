import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { classifyDbError } from "@/lib/db-errors";
import { httpError } from "@/lib/http";
import { dropColumn, findDeletedColumn, findTable } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");
    const column = await findDeletedColumn(table.id, params.column);
    if (!column) throw httpError(404, "This column isn't in the trash.");

    try {
      await dropColumn(c.get("workspaceId"), table, column);
    } catch (error) {
      throw httpError(409, classifyDbError(error).message);
    }
    return { ok: true };
  }),
);
