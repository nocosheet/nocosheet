import { columnTable, resourceTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { and, asc, count, db, eq, isNull, sql } from "void/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildDropTable } from "@/lib/tables/ddl";
import { physicalTableName, quoteIdent } from "@/lib/tables/naming";
import { findTable } from "@/lib/tables/server";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (_c, { params }) => {
  const table = await findTable(params.id);
  const tableColumns = await db
    .select()
    .from(columnTable)
    .where(and(eq(columnTable.tableId, table.id), isNull(columnTable.deletedAt)))
    .orderBy(asc(columnTable.position));
  return { ...table, columns: tableColumns };
});

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    const physicalName = physicalTableName(workspace, table.tableName);

    const [{ existing }] = await db
      .select({ existing: count() })
      .from(columnTable)
      .where(eq(columnTable.tableId, table.id));
    if (existing > 0)
      throw new HTTPException(409, { message: "Only an unfinished table can be discarded." });

    const [{ rows }] = await db.all<{ rows: number }>(
      sql`select count(*) as rows from ${sql.raw(quoteIdent(physicalName))}`,
    );
    if (Number(rows) > 0)
      throw new HTTPException(409, { message: "Only an unfinished table can be discarded." });

    await db.batch([
      db.run(sql.raw(buildDropTable(physicalName))),
      db.delete(resourceTable).where(eq(resourceTable.id, table.id)),
    ]);
    return { ok: true };
  }),
);
