import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { loadTrashEntry, purgeTrashEntry } from "@/lib/records/trash";
import { findTable } from "@/lib/tables/server";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  entry: z.coerce.number().int().positive(),
});

export const GET = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const table = await findTable(params.id);
    return loadTrashEntry(c.get("workspaceId"), table, params.entry);
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const table = await findTable(params.id);
    await purgeTrashEntry(table, params.entry);
    return { ok: true };
  }),
);
