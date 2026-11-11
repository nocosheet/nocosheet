import { defineHandler } from "void";
import { z } from "zod";

import { loadRecordOptions } from "@/lib/records/server";
import { findTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });
const query = z.object({ q: z.string().trim().max(100).default("") });

export const GET = defineHandler.withValidator({ params, query })(async (c, { params, query }) => {
  const table = await findTable(params.id);
  return loadRecordOptions(c.get("workspaceId"), table, query.q);
});
