import { defineHandler } from "void";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { findRecordOptions } from "@/lib/records/repository";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });
const query = z.object({ q: z.string().trim().max(100).default("") });

export const GET = defineHandler.withValidator({ params, query })(async (c, { params, query }) => {
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  return findRecordOptions(c.get("workspaceId"), table, query.q);
});
