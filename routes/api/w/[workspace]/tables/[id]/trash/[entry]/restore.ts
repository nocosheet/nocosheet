import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { restoreRecord } from "@/lib/records/trash";
import { recordPatchSchema } from "@/lib/records/values";
import { findTable } from "@/lib/tables/server";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  entry: z.coerce.number().int().positive(),
});

const body = recordPatchSchema.partial();

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body })(async (c, { params, body }) => {
    const table = await findTable(params.id);
    return restoreRecord(c.get("workspaceId"), table, params.entry, body.values ?? {});
  }),
);
