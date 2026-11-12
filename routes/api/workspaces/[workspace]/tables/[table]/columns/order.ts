import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { findTable, listColumns, reorderColumns } from "@/lib/tables/repository";
import { columnOrderSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const PUT = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnOrderSchema })(async (_c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const current = (await listColumns(table.id)).map((column) => column.id);
    const same =
      body.ids.length === current.length &&
      new Set(body.ids).size === body.ids.length &&
      current.every((id) => body.ids.includes(id));
    if (!same) throw httpError(409, "The column list changed. Refresh the page and try again.");

    try {
      await reorderColumns(table.id, body.ids);
    } catch (error) {
      throw httpError(
        400,
        error instanceof Error ? error.message : "The columns could not be reordered.",
      );
    }
    return { ok: true };
  }),
);
