import { columnTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { and, db, eq, isNull, sql } from "void/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildCreateIndex, buildDropColumn, buildDropIndex, indexKind } from "@/lib/tables/ddl";
import { SEARCHABLE_FORMATS } from "@/lib/tables/formats";
import { physicalTableName } from "@/lib/tables/naming";
import { conflictOrBadRequest, defined, findColumn, findTable } from "@/lib/tables/server";
import { columnPatchSchema } from "@/lib/tables/validation";

const params = z.object({
  workspace: z.string(),
  id: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
});

export const PATCH = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnPatchSchema })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    const column = await findColumn(table.id, params.column);
    const physicalName = physicalTableName(workspace, table.tableName);

    if (body.isSearchable && !SEARCHABLE_FORMATS.includes(column.format as never))
      throw new HTTPException(400, { message: "Only text columns can be searchable." });

    const patch = defined(body);
    const before = indexKind(column);
    const after = indexKind({ ...column, ...patch });

    try {
      const statements = [];
      if (before !== after) {
        if (before)
          statements.push(db.run(sql.raw(buildDropIndex(physicalName, column.columnName, before))));
        if (after)
          statements.push(
            db.run(sql.raw(buildCreateIndex(physicalName, column.columnName, after))),
          );
      }

      await db.batch([
        db.update(columnTable).set(patch).where(eq(columnTable.id, column.id)),
        db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
        ...statements,
      ]);
    } catch (error) {
      conflictOrBadRequest(error, "A column with this name already exists.");
    }

    const [updated] = await db
      .select()
      .from(columnTable)
      .where(and(eq(columnTable.id, column.id), isNull(columnTable.deletedAt)))
      .limit(1);
    return updated;
  }),
);

export const DELETE = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params })(async (c, { params }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    const column = await findColumn(table.id, params.column);
    const physicalName = physicalTableName(workspace, table.tableName);

    const siblings = await db
      .select()
      .from(columnTable)
      .where(and(eq(columnTable.tableId, table.id), isNull(columnTable.deletedAt)));
    const usage = new RegExp(`\\b${column.columnName}\\b`, "i");
    const dependent = siblings.find(
      (other) =>
        other.id !== column.id &&
        [other.generatedExpression, other.checkExpression].some((expr) => expr && usage.test(expr)),
    );
    if (dependent)
      throw new HTTPException(409, {
        message: `"${dependent.name}" uses "${column.name}" in its formula or check, so it can't be deleted.`,
      });

    const kind = indexKind(column);
    try {
      await db.batch([
        db.run(sql.raw(kind ? buildDropIndex(physicalName, column.columnName, kind) : "select 1")),
        db.run(sql.raw(buildDropColumn(physicalName, column.columnName))),
        db.delete(columnTable).where(eq(columnTable.id, column.id)),
        db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
      ]);
    } catch (error) {
      throw new HTTPException(409, {
        message: error instanceof Error ? error.message : "The column could not be deleted.",
      });
    }

    return { ok: true };
  }),
);
