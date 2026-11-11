import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError, writeFailure } from "@/lib/http";
import { checkLinks } from "@/lib/records/links";
import { restoredSystemValues, mergeSnapshot, snapshotAuthors } from "@/lib/records/restore";
import { findExistingUserIds, findTrashEntry, restoreRow } from "@/lib/records/trash-repository";
import { findMissingRequired, parseRecordValues, recordPatchSchema } from "@/lib/records/values";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  entry: z.coerce.number().int().positive(),
});

const body = recordPatchSchema.partial();

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    if (!table) throw httpError(404, "Table not found.");
    const entry = await findTrashEntry(table, params.entry);
    if (!entry) throw httpError(404, "This record is no longer in the trash.");
    const columns = await listColumns(table.id);

    const edits = parseRecordValues(columns, body.values ?? {});
    if (!edits.ok) throw httpError(400, edits.message, edits.field);

    const parsed = mergeSnapshot(columns, entry.data, edits.values);
    const broken = await checkLinks(workspace, parsed);
    if (broken) throw httpError(400, broken.message, broken.field);
    const missing = findMissingRequired(columns, parsed);
    if (missing)
      throw httpError(400, `${missing.name}: This field is required`, missing.columnName);

    const known = await findExistingUserIds(snapshotAuthors(entry.data));
    try {
      await restoreRow(workspace, table, entry.id, parsed, restoredSystemValues(entry.data, known));
    } catch (error) {
      writeFailure(error, columns);
    }
    return { id: entry.data.id };
  }),
);
