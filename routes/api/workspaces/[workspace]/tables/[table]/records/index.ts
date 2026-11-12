import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError, writeFailure } from "@/lib/http";
import { deleteRecords } from "@/lib/records/deletion";
import { checkLinks } from "@/lib/records/links";
import { recordsApiSchema, recordsDeleteSchema, resolveRecordsQuery } from "@/lib/records/query";
import { countOwnedRecords, createRecordRow, findRecords } from "@/lib/records/repository";
import { checkRecordsQuery } from "@/lib/records/validation";
import { findMissingRequired, parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await authorize(requireAuth(c), "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const columns = await listColumns(table.id);
  const resolved = resolveRecordsQuery(query);

  const problem = checkRecordsQuery(columns, resolved);
  if (problem) throw httpError(400, problem);

  try {
    return await findRecords(c.get("workspaceId"), table, columns, resolved, ownerId);
  } catch (error) {
    throw httpError(
      400,
      error instanceof Error ? error.message : "The records could not be loaded.",
    );
  }
});

export const POST = defineHandler.withValidator({ params, body: recordPatchSchema })(async (
  c,
  { params, body },
) => {
  const workspace = c.get("workspaceId");
  await authorize(requireAuth(c), "create", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const columns = await listColumns(table.id);

  const parsed = parseRecordValues(columns, body.values);
  if (!parsed.ok) throw httpError(400, parsed.message, parsed.field);

  const broken = await checkLinks(workspace, parsed.values);
  if (broken) throw httpError(400, broken.message, broken.field);

  const missing = findMissingRequired(columns, parsed.values);
  if (missing) throw httpError(400, `${missing.name}: This field is required`, missing.columnName);

  try {
    const created = await createRecordRow(workspace, table, parsed.values, requireAuth(c).id);
    if (!created) throw httpError(400, "The record could not be created.");
    return { id: created.id };
  } catch (error) {
    writeFailure(error, columns);
  }
});

export const DELETE = defineHandler.withValidator({ params, body: recordsDeleteSchema })(async (
  c,
  { params, body },
) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  const { ownerId } = await authorize(user, "delete", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");

  if (ownerId) {
    const ids = [...new Set(body.ids)];
    if ((await countOwnedRecords(workspace, table, ids, ownerId)) !== ids.length)
      throw httpError(403, "You can only delete records you created.");
  }

  const result = await deleteRecords(workspace, table, body.ids, user.id);
  if (!result.ok)
    throw httpError(
      result.reason === "not_found" ? 404 : result.reason === "linked" ? 409 : 400,
      result.message,
    );
  return { trash: result.trash };
});
