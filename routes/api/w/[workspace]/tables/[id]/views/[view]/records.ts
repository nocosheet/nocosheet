import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { recordsApiSchema, resolveRecordsQuery } from "@/lib/records/query";
import { findRecords } from "@/lib/records/repository";
import { checkRecordsQuery } from "@/lib/records/validation";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";
import { physicalViewName } from "@/lib/views/naming";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await authorize(requireAuth(c), "read", params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  const row = await findView(table.id, params.view);
  if (!row) throw httpError(404, "View not found.");

  const all = await listColumns(table.id);
  const shown = all.filter((column) => row.selectColumns.includes(column.columnName));
  const resolved = resolveRecordsQuery(query);

  const problem = checkRecordsQuery(shown, resolved);
  if (problem) throw httpError(400, problem);

  try {
    const workspace = c.get("workspaceId");
    return await findRecords(
      workspace,
      table,
      shown,
      resolved,
      ownerId,
      physicalViewName(workspace, row.viewName),
    );
  } catch (error) {
    throw httpError(
      400,
      error instanceof Error ? error.message : "The records could not be loaded.",
    );
  }
});
