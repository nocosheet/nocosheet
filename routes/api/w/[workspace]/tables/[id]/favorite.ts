import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { httpError } from "@/lib/http";
import { addFavorite, findTable, removeFavorite } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const PUT = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  const table = await findTable(params.id);
  if (!table) throw httpError(404, "Table not found.");
  await addFavorite(user.id, table.id);
  return { ok: true };
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await removeFavorite(user.id, params.id);
  return { ok: true };
});
