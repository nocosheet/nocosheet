import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { loadRecord, updateRecord } from "@/lib/records/server";
import { deleteRecords } from "@/lib/records/trash";
import { recordPatchSchema } from "@/lib/records/values";
import { findTable } from "@/lib/tables/server";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  record: z.string().min(1).max(64),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const table = await findTable(params.id);
  return loadRecord(c.get("workspaceId"), table, params.record);
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: recordPatchSchema })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    return updateRecord(c.get("workspaceId"), table, params.record, body.values, requireAuth(c).id);
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.id);
    return deleteRecords(c.get("workspaceId"), table, [params.record], requireAuth(c).id);
  }),
);
