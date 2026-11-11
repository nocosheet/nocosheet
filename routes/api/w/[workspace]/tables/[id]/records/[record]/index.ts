import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { checkLinks } from "@/lib/records/links";
import { findRecord, updateRecordRow } from "@/lib/records/repository";
import { parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  record: z.string().min(1).max(64),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  const record = await findRecord(
    c.get("workspaceId"),
    table,
    await listColumns(table.id),
    params.record,
  );
  if (!record) throw httpError(404, "Record not found.");
  return record;
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: recordPatchSchema })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");
    const columns = await listColumns(table.id);

    const parsed = parseRecordValues(columns, body.values);
    if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);
    if (parsed.values.length === 0) throw httpError(400, "Nothing to update.");

    const broken = await checkLinks(workspace, parsed.values);
    if (broken) throw httpError(400, broken.message, broken.field);

    let updated = false;
    try {
      updated = await updateRecordRow(
        workspace,
        table,
        params.record,
        parsed.values,
        requireAuth(c).id,
      );
    } catch (error) {
      writeFailure(error, columns);
    }
    if (!updated) throw httpError(404, "Record not found.");
    return { ok: true };
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");

    const result = await deleteRecords(
      c.get("workspaceId"),
      table,
      [params.record],
      requireAuth(c).id,
    );
    if (!result.ok)
      throw httpError(
        result.reason === "not_found" ? 404 : result.reason === "linked" ? 409 : 400,
        result.message,
      );
    return { trash: result.trash };
  }),
);
