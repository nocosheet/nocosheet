import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { recordsApiSchema, recordsDeleteSchema, resolveRecordsQuery } from "@/lib/records/query";
import { createRecord, deleteRecords, loadRecords } from "@/lib/records/server";
import { recordPatchSchema } from "@/lib/records/values";
import { findTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const table = await findTable(params.id);
  return loadRecords(c.get("workspaceId"), table, resolveRecordsQuery(query));
});

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: recordsDeleteSchema })(
    async (c, { params, body }) => {
      const table = await findTable(params.id);
      await deleteRecords(c.get("workspaceId"), table, body.ids);
      return { ok: true };
    },
  ),
);

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: recordPatchSchema })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    return createRecord(c.get("workspaceId"), table, body.values, requireAuth(c).id);
  }),
);
