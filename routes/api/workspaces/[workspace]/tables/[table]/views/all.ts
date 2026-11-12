import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { authorize } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";
import { listViews } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  await authorize(requireAuth(c), "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  return listViews(table.id);
});
