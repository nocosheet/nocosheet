import { columnTable, tableTable } from "@db/schema";
import { HTTPException } from "hono/http-exception";
import { defineHandler } from "void";
import { and, db, eq, isNull, sql } from "void/db";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { buildAddColumn, columnSqliteType, DdlError, type RelationTarget } from "@/lib/tables/ddl";
import { physicalTableName, toColumnName } from "@/lib/tables/naming";
import { conflictOrBadRequest, findTable } from "@/lib/tables/server";
import { columnInputSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), id: z.coerce.number().int().positive() });

export const POST = defineHandler(
  requireAdmin,
  defineHandler.withValidator({ params, body: columnInputSchema })(async (c, { params, body }) => {
    const workspace = c.get("workspaceId");
    const table = await findTable(params.id);
    const physicalName = physicalTableName(workspace, table.tableName);

    const targets = new Map<number, RelationTarget>();
    if (body.format === "relation") {
      const [target] = await db
        .select()
        .from(tableTable)
        .where(and(eq(tableTable.id, Number(body.options.tableId)), isNull(tableTable.deletedAt)))
        .limit(1);
      if (target)
        targets.set(target.id, {
          physicalName: physicalTableName(workspace, target.tableName),
          idType: target.idType,
        });
    }

    const columnName = toColumnName(body.name);

    try {
      const [first, ...rest] = buildAddColumn(physicalName, body, targets).map((statement) =>
        db.run(sql.raw(statement)),
      );

      await db.batch([
        first,
        ...rest,
        db.insert(columnTable).values({
          tableId: table.id,
          columnName,
          name: body.name,
          icon: body.icon,
          description: body.description,
          type: columnSqliteType(body, targets),
          format: body.format,
          options: body.options,
          isRequired: body.isRequired,
          isFilterable: body.isFilterable,
          isSortable: body.isSortable,
          isSearchable: body.isSearchable,
          isUnique: body.isUnique,
          isHidden: body.isHidden,
          defaultValue: body.defaultValue,
          checkExpression: body.checkExpression,
          generatedExpression: body.generatedExpression,
          position: body.position,
        }),
        db.update(tableTable).set({ updatedAt: new Date() }).where(eq(tableTable.id, table.id)),
      ]);
    } catch (error) {
      if (error instanceof DdlError) throw new HTTPException(400, { message: error.message });
      conflictOrBadRequest(error, "A column with this name already exists.");
    }

    const [created] = await db
      .select()
      .from(columnTable)
      .where(and(eq(columnTable.tableId, table.id), eq(columnTable.columnName, columnName)))
      .limit(1);
    return created;
  }),
);
