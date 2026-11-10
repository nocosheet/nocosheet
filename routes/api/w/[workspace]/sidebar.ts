import { favoriteTable, tableTable } from "@db/schema";
import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { and, asc, db, eq, isNull } from "void/db";

import { buildSidebar } from "@/lib/tables/sidebar";

export const GET = defineHandler(async (c) => {
  const user = requireAuth(c);

  const rows = await db
    .select({
      id: tableTable.id,
      name: tableTable.name,
      icon: tableTable.icon,
      groupName: tableTable.groupName,
      updatedAt: tableTable.updatedAt,
      favoritedAt: favoriteTable.createdAt,
    })
    .from(tableTable)
    .leftJoin(
      favoriteTable,
      and(eq(favoriteTable.tableId, tableTable.id), eq(favoriteTable.userId, user.id)),
    )
    .where(isNull(tableTable.deletedAt))
    .orderBy(asc(tableTable.position), asc(tableTable.id));

  return buildSidebar(rows);
});
