import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import {
  findDeletedAmong,
  findDeletedTable,
  findLinkedTableIds,
  restoreTable,
} from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const table = await findDeletedTable(params.table);
    if (!table) throw httpError(404, "This table isn't in the trash.");

    const targets = await findLinkedTableIds(table.id);
    const deleted = targets.length > 0 ? await findDeletedAmong(targets) : undefined;
    if (deleted)
      throw httpError(
        409,
        `"${table.name}" links to "${deleted.name}", which is in the trash. Restore "${deleted.name}" first.`,
      );

    try {
      await restoreTable(table.id);
    } catch (error) {
      conflictOrBadRequest(error, `A table named "${table.name}" already exists.`);
    }
    return { id: table.id };
  }),
);
