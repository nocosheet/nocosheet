import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { checkLinks } from "@/lib/records/links";
import { countOwnedRecords, findRecord, updateRecordRow } from "@/lib/records/repository";
import { parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  record: z.string().min(1).max(64),
});

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const { ownerId } = await authorize(requireAuth(c), "read", params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  const record = await findRecord(
    c.get("workspaceId"),
    table,
    await listColumns(table.id),
    params.record,
    ownerId,
  );
  if (!record) throw httpError(404, "Record not found.");
  return record;
});

export const PATCH = defineHandler.withValidator({ params, body: recordPatchSchema })(async (
  c,
  { params, body },
) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await authorize(user, "update", params.id);
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
      user.id,
      ownerId,
    );
  } catch (error) {
    writeFailure(error, columns);
  }
  if (!updated) throw httpError(404, "Record not found.");
  return { ok: true };
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await authorize(user, "delete", params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");

  if (ownerId && (await countOwnedRecords(workspace, table, [params.record], ownerId)) !== 1)
    throw httpError(403, "You can only delete records you created.");

  const result = await deleteRecords(workspace, table, [params.record], user.id);
  if (!result.ok)
    throw httpError(
      result.reason === "not_found" ? 404 : result.reason === "linked" ? 409 : 400,
      result.message,
    );
  return { trash: result.trash };
});
