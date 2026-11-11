import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { findExportRecords } from "@/lib/records/repository";
import { authorizeExport } from "@/lib/roles/guard";
import { findTable, listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const { ownerId } = await authorizeExport(requireAuth(c), params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  return findExportRecords(c.get("workspaceId"), table, await listColumns(table.id), ownerId);
});
