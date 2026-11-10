import { favoriteTable } from "@db/schema";
import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { and, db, eq } from "void/db";
import { z } from "zod";

import { findTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const PUT = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  const table = await findTable(params.id);
  await db
    .insert(favoriteTable)
    .values({ userId: user.id, tableId: table.id })
    .onConflictDoNothing();
  return { ok: true };
});

export const DELETE = defineHandler.withValidator({ params })(async (c, { params }) => {
  const user = requireAuth(c);
  await db
    .delete(favoriteTable)
    .where(and(eq(favoriteTable.userId, user.id), eq(favoriteTable.tableId, params.id)));
  return { ok: true };
});
