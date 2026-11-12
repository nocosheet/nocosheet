import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { findDeletedView, restoreView } from "@/lib/views/repository";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (_c, { params }) => {
    const view = await findDeletedView(params.table, params.view);
    if (!view) throw httpError(404, "This view isn't in the trash.");

    try {
      await restoreView(view.id);
    } catch (error) {
      conflictOrBadRequest(error, `A view named "${view.name}" already exists.`);
    }
    return { id: view.id };
  }),
);
