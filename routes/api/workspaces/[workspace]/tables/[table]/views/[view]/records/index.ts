import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { targetsOfColumns, parseFilters } from "@/lib/records/filter-param";
import { recordsApiSchema, resolveRecordsQuery, withFilters } from "@/lib/records/query";
import { sortKeyOf } from "@/lib/records/sort-param";
import { findRecords } from "@/lib/records/repository";
import { checkRecordsQuery } from "@/lib/records/validation";
import { authorize } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";
import { physicalViewName } from "@/lib/views/naming";
import { findView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const GET = defineHandler.withValidator({ params, query: recordsApiSchema })(async (
  c,
  { params, query },
) => {
  const { ownerId } = await authorize(requireAuth(c), "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const row = await findView(table.id, params.view);
  if (!row) throw httpError(404, "View not found.");

  const all = await listColumns(table.id);
  const shown = all.filter((column) => row.selectColumns.includes(column.columnName));
  const parsed = parseFilters(resolveRecordsQuery(query).filter, targetsOfColumns(shown));
  if (parsed.errors.length) throw httpError(400, parsed.errors[0]);
  const requested = resolveRecordsQuery(query);
  const sort = sortKeyOf(shown, requested.sort);
  if (sort === undefined) throw httpError(400, `"${requested.sort}" can't be sorted.`);
  const resolved = { ...withFilters(requested, parsed.filters), sort };

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
