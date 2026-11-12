import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { authorize } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";
import { resolveViewsQuery, viewsSearchSchema } from "@/lib/views/query";
import { listViewsPage } from "@/lib/views/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params, query: viewsSearchSchema })(async (
  c,
  { params, query },
) => {
  await authorize(requireAuth(c), "read", params.id);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  return listViewsPage(table.id, resolveViewsQuery(query));
});
