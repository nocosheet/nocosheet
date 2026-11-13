import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError } from "@/lib/http";
import { findTable } from "@/lib/tables/repository";
import {
  findView,
  softDeleteView,
  updateView,
} from "@/lib/views/repository";
import { viewPatchSchema } from "@/lib/views/validation";

const params = z.object({
  workspace: z.string(),
  table: z.coerce.number().int().positive(),
  view: z.coerce.number().int().positive(),
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: viewPatchSchema })(async (c, { params, body }) => {
    const table = await findTable(params.table);
    if (!table) throw httpError(404, "Table not found.");
    const view = await findView(table.id, params.view);
    if (!view) throw httpError(404, "View not found.");

    try {
      return await updateView(params.view, body);
    } catch (error) {
      conflictOrBadRequest(error, "A view with this name already exists.");
    }
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    if (!(await findView(params.table, params.view))) throw httpError(404, "View not found.");
    await softDeleteView(params.view, requireAuth(c).id);
    return { ok: true };
  }),
);
