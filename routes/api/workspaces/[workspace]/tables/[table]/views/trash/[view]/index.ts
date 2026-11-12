import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { httpError } from "@/lib/http";
import { findDeletedView, purgeView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const view = await findDeletedView(params.table, params.view);
    if (!view) throw httpError(404, "This view isn't in the trash.");
    await purgeView(c.get("workspaceId"), view);
    return { ok: true };
  }),
);
