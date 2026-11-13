import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { DdlError, type RelationTarget } from "@/lib/tables/ddl";
import {
  createColumn,
  findRelationTarget,
  findTable,
} from "@/lib/tables/repository";
import { columnInputSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnInputSchema })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");

    const targets = new Map<number, RelationTarget>();
    if (body.format === "relation") {
      const target = await findRelationTarget(workspace, Number(body.options.tableId));
      if (target) targets.set(target.id, target);
    }

    try {
      return await createColumn(workspace, table, body, targets);
    } catch (error) {
      if (error instanceof DdlError) throw httpError(400, error.message);
      conflictOrBadRequest(error, "A column with this name already exists.");
    }
  }),
);
