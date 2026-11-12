import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { findRecordOptions } from "@/lib/records/repository";
import { authorize } from "@/lib/roles/guard";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });
const query = z.object({ q: z.string().trim().max(100).default("") });

export const GET = defineHandler.withValidator({ params, query })(async (c, { params, query }) => {
  const { ownerId } = await authorize(requireAuth(c), "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  return findRecordOptions(c.get("workspaceId"), table, query.q, ownerId);
});
