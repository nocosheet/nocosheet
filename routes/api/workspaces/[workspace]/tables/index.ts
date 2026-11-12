import { defineHandler } from "void";
import { requireAuth } from "void/auth";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { resolveTablesQuery, tablesSearchSchema } from "@/lib/tables/query";
import {
  createTable,
  dropTables,
  findLinkingColumns,
  findTables,
  findTrashedTableByName,
  listTables,
  softDeleteTables,
} from "@/lib/tables/repository";
import { tableInputSchema, tablesDeleteSchema } from "@/lib/tables/validation";

export const GET = defineHandler.withValidator({ query: tablesSearchSchema })(
  async (_c, { query }) => listTables(resolveTablesQuery(query)),
);

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: tableInputSchema })(async (c, { body }) => {
    const user = requireAuth(c);

    const trashed = await findTrashedTableByName(body.name);
    if (trashed)
      throw httpError(
        409,
        `A deleted table named "${trashed.name}" is still in the trash. Restore it or delete it forever from the trash first.`,
      );

    try {
      return await createTable(c.get("workspaceId"), body, user.id);
    } catch (error) {
      conflictOrBadRequest(error, "A table with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ body: tablesDeleteSchema })(async (c, { body }) => {
    const ids = [...new Set(body.ids)];

    const tables = await findTables(ids);
    if (tables.length !== ids.length) throw httpError(404, "Table not found.");

    const [link] = await findLinkingColumns(ids, { liveOnly: true });
    if (link)
      throw httpError(
        409,
        `"${link.table}" has a column "${link.column}" that links to a table you are deleting. Delete "${link.table}" first.`,
      );

    try {
      if (body.permanent) await dropTables(c.get("workspaceId"), tables);
      else await softDeleteTables(ids, requireAuth(c).id);
    } catch (error) {
      throw httpError(
        409,
        error instanceof Error ? error.message : "The tables could not be deleted.",
      );
    }
    return { ok: true };
  }),
);
