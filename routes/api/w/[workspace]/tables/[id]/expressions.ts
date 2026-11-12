import { defineHandler } from "void";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { findTable, readColumnExpressions } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  return readColumnExpressions(c.get("workspaceId"), table);
});
